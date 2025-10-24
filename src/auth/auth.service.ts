import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtConfigService } from './config/jwt-config.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly jwtConfig: JwtConfigService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');
    return user;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);
    const payload = { sub: user.id, role: user.role, username: user.username };
    const accessToken = await this.jwt.signAsync(
      payload,
      this.jwtConfig.getAccessTokenConfig(),
    );
    const refreshToken = await this.jwt.signAsync(
      payload,
      this.jwtConfig.getRefreshTokenConfig(),
    );
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshHash },
    });
    return {
      user: { id: user.id, username: user.username, role: user.role },
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshHash: null },
    });
    return { success: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, role: true },
    });
    return user;
  }

  async refresh(oldRefresh: string) {
    const payload = this.jwt.decode(oldRefresh) as any;
    if (!payload?.sub) throw new UnauthorizedException('Token inválido');
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user?.refreshHash) throw new UnauthorizedException('Token inválido');
    const ok = await bcrypt.compare(oldRefresh, user.refreshHash);
    if (!ok) throw new UnauthorizedException('Token inválido');
    const newPayload = {
      sub: user.id,
      role: user.role,
      username: user.username,
    };
    const accessToken = await this.jwt.signAsync(
      newPayload,
      this.jwtConfig.getAccessTokenConfig(),
    );
    const refreshToken = await this.jwt.signAsync(
      newPayload,
      this.jwtConfig.getRefreshTokenConfig(),
    );
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshHash },
    });
    return { accessToken, refreshToken };
  }
}

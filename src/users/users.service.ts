import {
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureUserIsOwner(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (user?.role !== 'OWNER') {
      throw new ForbiddenException('Solo OWNER puede realizar esta acción');
    }
  }

  async createAsOwner(
    requestingUserId: string,
    data: {
      username: string;
      passwordHash: string;
      role: 'OWNER' | 'ADMIN' | 'EMP';
    },
  ) {
    await this.ensureUserIsOwner(requestingUserId);
    return this.prisma.user.create({ data });
  }

  async listAll(requestingUserId: string) {
    await this.ensureUserIsOwner(requestingUserId);
    return this.prisma.user.findMany({
      select: { id: true, username: true, role: true, createdAt: true },
    });
  }

  async updateAsOwner(
    requestingUserId: string,
    id: string,
    data: { passwordHash?: string; role?: 'OWNER' | 'ADMIN' | 'EMP' },
  ) {
    await this.ensureUserIsOwner(requestingUserId);
    return this.prisma.user.update({ where: { id }, data });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const passwordMatch = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!passwordMatch) {
      throw new UnauthorizedException('Contraseña actual incorrecta');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
      select: { id: true, username: true, role: true },
    });
  }
}

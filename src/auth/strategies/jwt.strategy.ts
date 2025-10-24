import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CurrentUserPayload } from '../../common/types/current-user.type';

interface JwtPayload {
  sub: string;
  username: string;
  role: 'OWNER' | 'ADMIN' | 'EMP';
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'dev-access',
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUserPayload> {
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }
}

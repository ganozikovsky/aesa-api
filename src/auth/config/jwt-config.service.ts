import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtConfigService {
  constructor(private readonly configService: ConfigService) {}

  getAccessTokenConfig() {
    return {
      expiresIn: this.configService.get('JWT_ACCESS_TTL', '30d'),
      secret: this.configService.get('JWT_ACCESS_SECRET', 'dev-access'),
    };
  }

  getRefreshTokenConfig() {
    return {
      expiresIn: this.configService.get('JWT_REFRESH_TTL', '30d'),
      secret: this.configService.get('JWT_REFRESH_SECRET', 'dev-refresh'),
    };
  }
}

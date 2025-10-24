import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { JwtConfigService } from './config/jwt-config.service';

@Module({
  imports: [PassportModule, JwtModule.register({}), PrismaModule, UsersModule],
  providers: [AuthService, JwtStrategy, JwtConfigService],
  controllers: [AuthController],
})
export class AuthModule {}

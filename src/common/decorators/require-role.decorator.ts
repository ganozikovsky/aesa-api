import { applyDecorators, UseGuards } from '@nestjs/common';
import { Roles } from './roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AppRole } from './roles.decorator';

/**
 * Decorador compuesto que aplica tanto autenticación JWT como autorización de roles
 * @param roles - Roles requeridos para acceder a la ruta
 *
 * @example
 * @Post()
 * @RequireRole('OWNER', 'ADMIN')
 * create(@Body() dto: CreateDto) { }
 */
export const RequireRole = (...roles: AppRole[]) =>
  applyDecorators(UseGuards(JwtAuthGuard, RolesGuard), Roles(...roles));

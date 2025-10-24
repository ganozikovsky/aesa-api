import {
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  EMP = 'EMP',
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MinLength(6)
  @MaxLength(100)
  password?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

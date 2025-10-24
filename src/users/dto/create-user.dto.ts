import { IsString, IsEnum, MinLength, MaxLength } from 'class-validator';

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  EMP = 'EMP',
}

export class CreateUserDto {
  @IsString()
  username!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;
}

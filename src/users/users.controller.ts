import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentUserPayload } from '../common/types/current-user.type';
import * as bcrypt from 'bcrypt';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

interface UpdateUserData {
  passwordHash?: string;
  role?: 'OWNER' | 'ADMIN' | 'EMP';
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Roles('OWNER')
  @Post()
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateUserDto,
  ) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.users.createAsOwner(user.userId, {
      username: dto.username,
      passwordHash,
      role: dto.role,
    });
  }

  @Roles('OWNER')
  @Get()
  async list(@CurrentUser() user: CurrentUserPayload) {
    return this.users.listAll(user.userId);
  }

  @Roles('OWNER')
  @Patch(':id')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    const data: UpdateUserData = {};
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    if (dto.role) {
      data.role = dto.role;
    }
    return this.users.updateAsOwner(user.userId, id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/change-password')
  async changePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.users.changePassword(
      user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}

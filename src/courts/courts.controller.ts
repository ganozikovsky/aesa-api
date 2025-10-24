import { Controller, Get, UseGuards } from '@nestjs/common';
import { CourtsService } from './courts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('courts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('courts')
export class CourtsController {
  constructor(private readonly courts: CourtsService) {}

  @Get()
  async list() {
    return this.courts.list();
  }
}

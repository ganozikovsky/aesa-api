import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { CourtsService } from './courts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
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

  @Patch(':id/default-price')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  async updateDefaultPrice(
    @Param('id') courtId: string,
    @Body() data: { defaultPrice: number },
  ) {
    return this.courts.updateDefaultPrice(courtId, data.defaultPrice);
  }
}

import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentUserPayload } from '../common/types/current-user.type';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

class PurchaseDto {
  @IsString() productId!: string;
  @IsNumber() @Min(1) qty!: number;
  @IsNumber() @Min(0) unitCost!: number;
}
class AdjustDto {
  @IsString() productId!: string;
  @IsNumber() qty!: number; // ±
  @IsNumber() @Min(0) unitCost!: number;
}

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Roles('EMP', 'ADMIN', 'OWNER')
  @Get('stock')
  stock() {
    return this.inventory.stock();
  }

  @Roles('ADMIN', 'OWNER')
  @Post('purchase')
  purchase(@CurrentUser() user: CurrentUserPayload, @Body() dto: PurchaseDto) {
    return this.inventory.purchase(user.userId, dto);
  }

  @Roles('ADMIN', 'OWNER')
  @Post('adjust')
  adjust(@CurrentUser() user: CurrentUserPayload, @Body() dto: AdjustDto) {
    return this.inventory.adjust(user.userId, dto);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentUserPayload } from '../common/types/current-user.type';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

class SaleItemDto {
  @IsString() productId!: string;
  @IsNumber() @Min(1) qty!: number;
}
class CreateSaleDto {
  @IsString() paymentMethodId!: string;
  @IsArray() @ArrayMinSize(1) items!: SaleItemDto[];
}

@ApiTags('sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly sales: SalesService) {}

  @Roles('EMP', 'ADMIN', 'OWNER')
  @Post()
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateSaleDto) {
    return this.sales.create(user.userId, dto);
  }

  @Roles('EMP', 'ADMIN', 'OWNER')
  @Get(':id')
  get(@Param('id') id: string) {
    return this.sales.getById(id);
  }

  @Roles('EMP', 'ADMIN', 'OWNER')
  @Get()
  getByDateRange(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.sales.getByDateRange(startDate, endDate);
  }
}

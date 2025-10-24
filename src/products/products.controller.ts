import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

class CreateProductDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsOptional() @IsString() @MaxLength(60) sku?: string;
  @IsNumber() @Min(0) salePrice!: number;
  @IsNumber() @Min(0) purchaseCost!: number;
  @IsOptional() @IsNumber() @Min(0) lowStockThreshold?: number;
  @IsOptional() @IsBoolean() active?: boolean;
}

class UpdateProductDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(60) sku?: string;
  @IsOptional() @IsNumber() @Min(0) salePrice?: number;
  @IsOptional() @IsNumber() @Min(0) purchaseCost?: number;
  @IsOptional() @IsNumber() @Min(0) lowStockThreshold?: number;
  @IsOptional() @IsBoolean() active?: boolean;
}

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Roles('EMP', 'ADMIN', 'OWNER')
  @Get()
  list(@Query('q') q?: string) {
    return this.products.list(q);
  }

  @Roles('ADMIN', 'OWNER')
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Roles('ADMIN', 'OWNER')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Roles('ADMIN', 'OWNER')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.products.delete(id);
  }
}

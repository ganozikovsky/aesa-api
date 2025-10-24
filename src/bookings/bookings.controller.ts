import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ChargeBookingDto } from './dto/charge-booking.dto';
import { CurrentUserPayload } from '../common/types/current-user.type';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  async daily(@Query('date') date: string) {
    return this.bookings.dailyAgenda(date);
  }

  @Post()
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookings.create({
      courtId: dto.courtId,
      dateISO: dto.dateISO,
      durationMin: dto.durationMin,
      listPrice: dto.listPrice,
      discount: dto.discount,
      userId: user.userId,
    });
  }

  @Post(':id/charge')
  async charge(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ChargeBookingDto,
  ) {
    return this.bookings.charge(id, {
      paymentMethodId: dto.paymentMethodId,
      totalPaid: dto.totalPaid,
      chargedByUserId: user.userId,
    });
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.bookings.cancel(id);
  }
}

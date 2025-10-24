import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async dailyAgenda(date: string) {
    const start = new Date(date + 'T00:00:00.000Z');
    const end = new Date(date + 'T23:59:59.999Z');
    return this.prisma.booking.findMany({
      where: { startAt: { gte: start, lte: end } },
      orderBy: { startAt: 'asc' },
      select: {
        id: true,
        startAt: true,
        durationMin: true,
        listPrice: true,
        discount: true,
        status: true,
        court: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async create(params: {
    courtId: string;
    dateISO: string;
    durationMin: number;
    listPrice: number;
    discount: number;
    userId: string;
  }) {
    const court = await this.prisma.court.findUnique({
      where: { id: params.courtId },
    });
    if (!court) throw new NotFoundException('Court no encontrada');
    const startAt = new Date(params.dateISO);
    if (Number.isNaN(startAt.getTime()))
      throw new BadRequestException('Fecha inválida');
    return this.prisma.booking.create({
      data: {
        courtId: params.courtId,
        startAt,
        durationMin: params.durationMin,
        listPrice: params.listPrice,
        discount: params.discount,
        createdByUserId: params.userId,
      },
    });
  }

  async charge(
    id: string,
    params: {
      paymentMethodId: string;
      totalPaid: number;
      chargedByUserId: string;
    },
  ) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking no encontrado');
    if (booking.status !== 'PENDIENTE')
      throw new BadRequestException('El booking no está pendiente');
    return this.prisma.booking.update({
      where: { id },
      data: {
        status: 'COBRADO',
        paymentMethodId: params.paymentMethodId,
        totalPaid: params.totalPaid,
        chargedByUserId: params.chargedByUserId,
        chargedAt: new Date(),
      },
    });
  }

  async cancel(id: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking no encontrado');
    if (booking.status !== 'PENDIENTE')
      throw new BadRequestException('El booking no está pendiente');
    return this.prisma.booking.update({
      where: { id },
      data: { status: 'CANCELADO' },
    });
  }
}

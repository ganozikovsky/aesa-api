import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMethods() {
    return this.prisma.paymentMethod.findMany({ orderBy: { name: 'asc' } });
  }
}

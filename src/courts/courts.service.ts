import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CourtsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.court.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }
}

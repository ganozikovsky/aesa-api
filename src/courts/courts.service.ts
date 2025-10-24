import { Injectable, BadRequestException } from '@nestjs/common';
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

  async updateDefaultPrice(courtId: string, defaultPrice: number) {
    if (defaultPrice < 0) {
      throw new BadRequestException('El precio debe ser >= 0');
    }

    const court = await this.prisma.court.findUnique({
      where: { id: courtId },
    });

    if (!court) {
      throw new BadRequestException('Cancha no encontrada');
    }

    return this.prisma.court.update({
      where: { id: courtId },
      data: { defaultPrice },
    });
  }
}

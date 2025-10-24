import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  list(q?: string) {
    return this.prisma.product.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { sku: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { name: 'asc' },
    });
  }

  create(data: {
    name: string;
    sku?: string;
    salePrice: number;
    purchaseCost: number;
    lowStockThreshold?: number;
    active?: boolean;
  }) {
    return this.prisma.product.create({ data });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      sku?: string;
      salePrice: number;
      purchaseCost: number;
      lowStockThreshold?: number;
      active?: boolean;
    }>,
  ) {
    const exists = await this.prisma.product.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Producto no encontrado');
    return this.prisma.product.update({ where: { id }, data });
  }

  async delete(id: string) {
    const exists = await this.prisma.product.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Producto no encontrado');
    return this.prisma.product.delete({ where: { id } });
  }
}

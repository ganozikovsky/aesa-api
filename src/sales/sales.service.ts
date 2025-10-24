import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { InventorySyncService } from '../inventory/inventory-sync.service';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly inventorySync: InventorySyncService,
  ) {}

  async create(
    userId: string,
    data: {
      paymentMethodId: string;
      items: { productId: string; qty: number }[];
    },
  ) {
    if (!data.items?.length) throw new BadRequestException('items requerido');
    for (const it of data.items)
      if (it.qty <= 0) throw new BadRequestException('qty debe ser > 0');

    const productIds = data.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const map = new Map(products.map((p) => [p.id, p]));

    const itemsPrepared: Array<{
      productId: string;
      qty: number;
      unitPrice: number;
      unitCostSnapshot: number;
      lineTotal: number;
      fifoBreakdown: Array<{ qty: number; unitCost: number }>;
    }> = [];

    for (const item of data.items) {
      const p = map.get(item.productId);
      if (!p) throw new NotFoundException('Producto no encontrado');

      const fifoBreakdown = await this.inventory.calculateFIFOCost(
        item.productId,
        item.qty,
      );

      const totalCost = fifoBreakdown.reduce(
        (sum, layer) => sum + layer.qty * layer.unitCost,
        0,
      );
      const weightedAvgCost = totalCost / item.qty;

      const unitPrice = Number(p.salePrice);
      const lineTotal = unitPrice * item.qty;

      itemsPrepared.push({
        productId: item.productId,
        qty: item.qty,
        unitPrice,
        unitCostSnapshot: weightedAvgCost,
        lineTotal,
        fifoBreakdown,
      });
    }

    const total = itemsPrepared.reduce((a, b) => a + b.lineTotal, 0);

    const sale = await this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: { userId, paymentMethodId: data.paymentMethodId, total },
      });

      await tx.saleItem.createMany({
        data: itemsPrepared.map((it) => ({
          saleId: sale.id,
          productId: it.productId,
          qty: it.qty,
          unitPrice: it.unitPrice,
          unitCostSnapshot: it.unitCostSnapshot,
          lineTotal: it.lineTotal,
        })),
      });

      for (const item of itemsPrepared) {
        for (const layer of item.fifoBreakdown) {
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              qty: -layer.qty,
              unitCost: layer.unitCost,
              type: 'SALE',
              refSaleId: sale.id,
              userId,
            },
          });
        }
      }

      return sale;
    });

    for (const item of itemsPrepared) {
      await this.inventorySync.syncMovement(item.productId);
    }

    return this.getById(sale.id);
  }

  getById(id: string) {
    return this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, salePrice: true },
            },
          },
        },
        paymentMethod: true,
        user: { select: { id: true, username: true } },
      },
    });
  }

  async getByDateRange(startDate?: string, endDate?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let start = today;
    let end = new Date(today);
    end.setHours(23, 59, 59, 999);

    if (startDate) {
      const parsed = new Date(startDate);
      if (!isNaN(parsed.getTime())) {
        start = parsed;
        start.setHours(0, 0, 0, 0);
      }
    }

    if (endDate) {
      const parsed = new Date(endDate);
      if (!isNaN(parsed.getTime())) {
        end = parsed;
        end.setHours(23, 59, 59, 999);
      }
    }

    return this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, salePrice: true },
            },
          },
        },
        paymentMethod: true,
        user: { select: { id: true, username: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

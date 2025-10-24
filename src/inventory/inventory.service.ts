import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventorySyncService } from './inventory-sync.service';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventorySync: InventorySyncService,
  ) {}

  async stock() {
    // Try to use fast InventoryStock table first
    const inventoryStocks = await this.prisma.inventoryStock.findMany({
      select: { productId: true, stock: true },
    });

    // If table is populated, use it (O(n) where n = num products)
    if (inventoryStocks.length > 0) {
      const stockMap = new Map(
        inventoryStocks.map((s) => [s.productId, s.stock]),
      );

      const products = await this.prisma.product.findMany({
        select: { id: true, name: true, lowStockThreshold: true },
      });

      return products.map((p) => ({
        productId: p.id,
        name: p.name,
        stock: Math.max((stockMap.get(p.id) as number) || 0, 0), // Never show negative
        lowStockThreshold: p.lowStockThreshold,
      }));
    }

    // Fallback: use InventoryMovement groupBy if InventoryStock not initialized
    const grouped = await this.prisma.inventoryMovement.groupBy({
      by: ['productId'],
      _sum: { qty: true },
    });
    const stockMap = new Map(
      grouped.map((g) => [g.productId, g._sum.qty || 0]),
    );
    const products = await this.prisma.product.findMany({
      select: { id: true, name: true, lowStockThreshold: true },
    });
    return products.map((p) => ({
      productId: p.id,
      name: p.name,
      stock: Math.max((stockMap.get(p.id) as number) || 0, 0), // Never show negative
      lowStockThreshold: p.lowStockThreshold,
    }));
  }

  async purchase(
    userId: string,
    data: { productId: string; qty: number; unitCost: number },
  ) {
    if (data.qty <= 0) throw new BadRequestException('qty debe ser > 0');
    await this.prisma.$transaction(async (tx) => {
      // Verify product exists
      const product = await tx.product.findUnique({
        where: { id: data.productId },
      });
      if (!product) throw new BadRequestException('Producto no encontrado');

      // Create inventory movement with FIFO cost tracking
      await tx.inventoryMovement.create({
        data: {
          productId: data.productId,
          qty: data.qty,
          unitCost: data.unitCost,
          type: 'PURCHASE',
          userId,
        },
      });
    });

    // Sync inventory stock after transaction
    await this.inventorySync.syncMovement(data.productId);

    return { success: true };
  }

  async adjust(
    userId: string,
    data: { productId: string; qty: number; unitCost: number },
  ) {
    if (data.qty === 0) throw new BadRequestException('qty no puede ser 0');
    await this.prisma.inventoryMovement.create({
      data: {
        productId: data.productId,
        qty: data.qty,
        unitCost: data.unitCost,
        type: 'ADJUST',
        userId,
      },
    });

    // Sync inventory stock after creating movement
    await this.inventorySync.syncMovement(data.productId);

    return { success: true };
  }

  /**
   * Calculate FIFO cost for qty units of a product
   * Returns array of { qty, unitCost } representing the FIFO layers
   */
  async calculateFIFOCost(productId: string, qtyToRemove: number) {
    // Get all purchase and positive adjustment movements (incoming stock)
    const incomingMoves = await this.prisma.inventoryMovement.findMany({
      where: {
        productId,
        type: { in: ['PURCHASE', 'ADJUST'] },
        qty: { gt: 0 },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Get all sales and outgoing adjustments (qty already used)
    const outgoingMoves = await this.prisma.inventoryMovement.findMany({
      where: {
        productId,
        type: { in: ['SALE', 'ADJUST'] },
        qty: { lt: 0 },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Build a map of which units are still available per batch
    const batches: Array<{ unitCost: number; available: number; id: string }> =
      [];

    for (const move of incomingMoves) {
      batches.push({
        id: move.id,
        unitCost: Number(move.unitCost),
        available: move.qty,
      });
    }

    // Deduct used quantities (FIFO)
    for (const move of outgoingMoves) {
      let qtyToDeduct = Math.abs(move.qty);
      for (const batch of batches) {
        if (qtyToDeduct <= 0) break;
        const deduction = Math.min(batch.available, qtyToDeduct);
        batch.available -= deduction;
        qtyToDeduct -= deduction;
      }
    }

    // Now build the cost breakdown for qtyToRemove
    const result: Array<{ unitCost: number; qty: number }> = [];
    let remaining = qtyToRemove;

    for (const batch of batches) {
      if (remaining <= 0) break;
      const qty = Math.min(batch.available, remaining);
      if (qty > 0) {
        result.push({ unitCost: batch.unitCost, qty });
        remaining -= qty;
      }
    }

    if (remaining > 0) {
      throw new BadRequestException(
        `No hay suficiente stock. Falta: ${remaining} unidades`,
      );
    }

    return result;
  }
}

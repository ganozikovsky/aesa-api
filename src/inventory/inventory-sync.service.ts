import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventorySyncService {
  private readonly logger = new Logger(InventorySyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Initialize InventoryStock for all products based on InventoryMovement
   * Safe to run multiple times - will update existing records
   */
  async initializeInventoryStock() {
    this.logger.log('Initializing InventoryStock from InventoryMovement...');

    try {
      // Get all products with their current stock
      const movements = await this.prisma.inventoryMovement.groupBy({
        by: ['productId'],
        _sum: { qty: true },
      });

      const stockMap = new Map(
        movements.map((m) => [m.productId, m._sum.qty || 0]),
      );

      // Get all products
      const products = await this.prisma.product.findMany({
        select: { id: true },
      });

      // Upsert InventoryStock for each product
      let count = 0;
      for (const product of products) {
        const stock = stockMap.get(product.id) || 0;
        try {
          await this.prisma.inventoryStock.upsert({
            where: { productId: product.id },
            update: { stock },
            create: {
              productId: product.id,
              stock,
            },
          });
          count++;
        } catch (error) {
          this.logger.warn(
            `Could not upsert stock for product ${product.id}`,
            error,
          );
        }
      }

      this.logger.log(
        `InventoryStock initialized for ${count}/${products.length} products`,
      );
    } catch (error) {
      this.logger.error('Error initializing InventoryStock:', error);
      // No lanzamos el error para no romper el servidor
    }
  }

  /**
   * Sync InventoryStock when a movement is created
   * Call this after creating any InventoryMovement
   */
  async syncMovement(productId: string) {
    try {
      // Calculate current stock from movements
      const movements = await this.prisma.inventoryMovement.aggregate({
        _sum: { qty: true },
        where: { productId },
      });

      const stock = Number(movements._sum.qty || 0);

      // Update or create InventoryStock
      await this.prisma.inventoryStock.upsert({
        where: { productId },
        update: { stock },
        create: {
          productId,
          stock,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Could not sync InventoryStock for product ${productId}`,
        error,
      );
      // No lanzamos el error para no romper el flujo
    }
  }

  /**
   * Get current stock from InventoryStock table (fast)
   */
  async getStockFromTable(productId: string): Promise<number> {
    try {
      const inventory = await this.prisma.inventoryStock.findUnique({
        where: { productId },
      });
      return inventory?.stock || 0;
    } catch (error) {
      this.logger.warn(
        `Could not get stock from table for ${productId}`,
        error,
      );
      return 0;
    }
  }

  /**
   * Get all stock from InventoryStock table (fast)
   */
  async getAllStockFromTable() {
    try {
      const stocks = await this.prisma.inventoryStock.findMany({
        select: {
          productId: true,
          stock: true,
        },
      });
      return new Map(stocks.map((s) => [s.productId, s.stock]));
    } catch (error) {
      this.logger.warn('Could not get all stock from table', error);
      return new Map();
    }
  }
}

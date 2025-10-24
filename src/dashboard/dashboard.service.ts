import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function startEndOfDay(dateIso: string | Date) {
  const d = new Date(dateIso);
  const start = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
  );
  const end = new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
  return { start, end };
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async today(now = new Date()) {
    const { start, end } = startEndOfDay(now);
    return this.getKpisByDateRange(start, end);
  }

  async getKpisByDateRange(start: Date, end: Date) {
    const [
      bookingsCobrados,
      sales,
      saleItems,
      paymentMethods,
      stockAgg,
      products,
    ] = await Promise.all([
      this.prisma.booking.aggregate({
        _sum: { totalPaid: true },
        where: { status: 'COBRADO', chargedAt: { gte: start, lte: end } },
      }),
      this.prisma.sale.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: start, lte: end } },
      }),
      this.prisma.saleItem.findMany({
        where: { sale: { createdAt: { gte: start, lte: end } } },
      }),
      this.prisma.paymentMethod.findMany(),
      this.prisma.inventoryMovement.groupBy({
        by: ['productId'],
        _sum: { qty: true },
      }),
      this.prisma.product.findMany({
        select: { id: true, name: true, lowStockThreshold: true },
      }),
    ]);

    const ingresosCancha = Number(bookingsCobrados._sum.totalPaid || 0);
    const ingresosProductos = Number(sales._sum.total || 0);
    const cogs = saleItems.reduce(
      (a, it) => a + Number(it.unitCostSnapshot) * it.qty,
      0,
    );
    const ganancia = ingresosCancha + ingresosProductos - cogs;

    const totalsByMethodMap = new Map<string, number>();
    const salesByMethod = await this.prisma.sale.groupBy({
      by: ['paymentMethodId'],
      _sum: { total: true },
      where: { createdAt: { gte: start, lte: end } },
    });
    for (const g of salesByMethod)
      totalsByMethodMap.set(g.paymentMethodId, Number(g._sum.total || 0));
    const totalsByMethod = paymentMethods.map((pm) => ({
      methodId: pm.id,
      name: pm.name,
      totalSales: totalsByMethodMap.get(pm.id) || 0,
    }));

    const topProductsAgg = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { qty: true },
      where: { sale: { createdAt: { gte: start, lte: end } } },
      orderBy: { _sum: { qty: 'desc' } },
      take: 5,
    });
    const productNameMap = new Map(products.map((p) => [p.id, p.name]));
    const topProducts = topProductsAgg.map((x) => ({
      productId: x.productId,
      name: productNameMap.get(x.productId) || '',
      qty: x._sum.qty || 0,
    }));

    const stockMap = new Map(
      stockAgg.map((s) => [s.productId, s._sum.qty || 0]),
    );
    const lowStock = products
      .map((p) => ({
        productId: p.id,
        name: p.name,
        stock: stockMap.get(p.id) || 0,
        lowStockThreshold: p.lowStockThreshold,
      }))
      .filter((p) => p.stock <= p.lowStockThreshold)
      .slice(0, 10);

    return {
      ingresosCancha,
      ingresosProductos,
      cogs,
      ganancia,
      totalsByMethod,
      topProducts,
      lowStock,
    };
  }
}

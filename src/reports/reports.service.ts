import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function startEnd(dateIso: string) {
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
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async daily(date: string) {
    const { start, end } = startEnd(date);
    const ingresosCancha = Number(
      (
        await this.prisma.booking.aggregate({
          _sum: { totalPaid: true },
          where: { status: 'COBRADO', chargedAt: { gte: start, lte: end } },
        })
      )._sum.totalPaid || 0,
    );
    const ingresosProductos = Number(
      (
        await this.prisma.sale.aggregate({
          _sum: { total: true },
          where: { createdAt: { gte: start, lte: end } },
        })
      )._sum.total || 0,
    );
    const items = await this.prisma.saleItem.findMany({
      where: { sale: { createdAt: { gte: start, lte: end } } },
    });
    const cogs = items.reduce(
      (a, it) => a + Number(it.unitCostSnapshot) * it.qty,
      0,
    );
    const ganancia = ingresosCancha + ingresosProductos - cogs;
    return { ingresosCancha, ingresosProductos, cogs, ganancia };
  }

  async range(from: string, to: string) {
    const start = new Date(from);
    const end = new Date(to);
    const ingresosCancha = Number(
      (
        await this.prisma.booking.aggregate({
          _sum: { totalPaid: true },
          where: { status: 'COBRADO', chargedAt: { gte: start, lte: end } },
        })
      )._sum.totalPaid || 0,
    );
    const ingresosProductos = Number(
      (
        await this.prisma.sale.aggregate({
          _sum: { total: true },
          where: { createdAt: { gte: start, lte: end } },
        })
      )._sum.total || 0,
    );
    const items = await this.prisma.saleItem.findMany({
      where: { sale: { createdAt: { gte: start, lte: end } } },
    });
    const cogs = items.reduce(
      (a, it) => a + Number(it.unitCostSnapshot) * it.qty,
      0,
    );
    const ganancia = ingresosCancha + ingresosProductos - cogs;
    return { ingresosCancha, ingresosProductos, cogs, ganancia };
  }

  async exportCsvDaily(date: string) {
    const { start, end } = startEnd(date);
    const bookings = await this.prisma.booking.findMany({
      where: { chargedAt: { gte: start, lte: end }, status: 'COBRADO' },
      include: { paymentMethod: true, court: true },
    });
    const sales = await this.prisma.sale.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { paymentMethod: true, items: true },
    });

    const lines: string[] = [];
    lines.push('type,id,datetime,amount,method,extra');
    for (const b of bookings) {
      lines.push(
        `booking,${b.id},${b.chargedAt?.toISOString() || ''},${b.totalPaid || 0},${b.paymentMethod?.name || ''},${b.court.name}`,
      );
    }
    for (const s of sales) {
      lines.push(
        `sale,${s.id},${s.createdAt.toISOString()},${s.total},${s.paymentMethod.name},items:${s.items.length}`,
      );
    }
    return lines.join('\n');
  }
}

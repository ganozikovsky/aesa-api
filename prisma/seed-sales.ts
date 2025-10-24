import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Simular ventas realistas durante octubre 2025
async function seedSales() {
  // Ensure owner exists
  const ownerUsername = 'gonzalo';
  const ownerPassword = 'Owner123!';

  let owner = await prisma.user.findFirst({
    where: { username: ownerUsername },
  });

  if (!owner) {
    const ownerHash = await bcrypt.hash(ownerPassword, 10);
    owner = await prisma.user.create({
      data: {
        username: ownerUsername,
        passwordHash: ownerHash,
        role: 'OWNER',
      },
    });
    console.log('✅ Usuario owner creado');
  }

  // Obtener métodos de pago
  const paymentMethods = await prisma.paymentMethod.findMany();
  const methodMap = new Map(paymentMethods.map((m) => [m.type, m.id]));

  // Obtener productos
  const products = await prisma.product.findMany();
  const productMap = new Map(products.map((p) => [p.sku, p]));

  // Primero, agregar stock inicial a los productos (compras iniciales)
  const initialPurchases = [
    { sku: 'QUILMES-473', qty: 50, cost: 1300 },
    { sku: 'QUILMES-1L', qty: 30, cost: 2000 },
    { sku: 'BRAHMA-473', qty: 45, cost: 1250 },
    { sku: 'BRAHMA-1L', qty: 25, cost: 1900 },
    { sku: 'STELLA-473', qty: 35, cost: 1600 },
    { sku: 'ANDES-473', qty: 40, cost: 1350 },
    { sku: 'CORONA-355', qty: 30, cost: 2000 },
    { sku: 'COCACOLA-2L', qty: 60, cost: 900 },
    { sku: 'COCAZERO-2L', qty: 50, cost: 900 },
    { sku: 'SPRITE-2L', qty: 50, cost: 800 },
    { sku: 'FANTA-NAR-2L', qty: 40, cost: 700 },
    { sku: 'AGUA-GLACIAR', qty: 100, cost: 300 },
    { sku: 'LAYS-CLASICAS', qty: 80, cost: 600 },
    { sku: 'LAYS-JAMON', qty: 70, cost: 650 },
    { sku: 'LAYS-QUESO', qty: 70, cost: 650 },
    { sku: 'DORITOS-QUESO', qty: 60, cost: 700 },
    { sku: 'DORITOS-NACHO', qty: 60, cost: 700 },
    { sku: 'CHEETOS-80', qty: 70, cost: 650 },
    { sku: 'MANI-GARBANZO', qty: 80, cost: 550 },
    { sku: 'MIX-FRUTOS', qty: 40, cost: 1100 },
    { sku: 'MILKA-40', qty: 100, cost: 400 },
    { sku: 'LOLLIPOP', qty: 150, cost: 75 },
  ];

  console.log('📦 Agregando stock inicial...');
  for (const purchase of initialPurchases) {
    const product = productMap.get(purchase.sku);
    if (product) {
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          qty: purchase.qty,
          unitCost: purchase.cost,
          type: 'PURCHASE',
          userId: owner.id,
        },
      });
    }
  }

  // Crear ventas realistas durante octubre
  console.log('💰 Agregando ventas del mes...');

  const startDate = new Date(2025, 9, 1); // 1 de octubre 2025
  const endDate = new Date(2025, 9, 24); // Hasta hoy (24 de octubre)

  type PaymentType = 'EFECTIVO' | 'DEBITO' | 'CREDITO' | 'TRANSFERENCIA' | 'QR';

  const salesData: Array<{
    date: Date;
    items: Array<{ sku: string; qty: number }>;
    paymentType: PaymentType;
  }> = [];

  // Generar ventas por día (patrones realistas)
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    let numSales = 0;

    // Patrón realista: más ventas viernes y sábados
    if (dayOfWeek === 5) {
      numSales = 8; // Viernes
    } else if (dayOfWeek === 6) {
      numSales = 12; // Sábado
    } else if (dayOfWeek === 0) {
      numSales = 10; // Domingo
    } else {
      numSales = 4; // Entre semana
    }

    for (let s = 0; s < numSales; s++) {
      const hour = Math.floor(Math.random() * 12) + 18; // 18:00 a 23:59
      const minute = Math.floor(Math.random() * 60);
      const saleDate = new Date(d);
      saleDate.setHours(hour, minute, 0, 0);

      // Seleccionar productos aleatorios
      const numItems = Math.floor(Math.random() * 4) + 1; // 1-4 items
      const items: Array<{ sku: string; qty: number }> = [];
      const selectedSkus = new Set<string>();

      // Productos populares
      const popularSkus = [
        'QUILMES-473',
        'BRAHMA-473',
        'CORONA-355',
        'COCACOLA-2L',
        'SPRITE-2L',
        'LAYS-CLASICAS',
        'DORITOS-QUESO',
      ];

      for (let i = 0; i < numItems; i++) {
        let sku = '';
        do {
          sku = popularSkus[Math.floor(Math.random() * popularSkus.length)];
        } while (selectedSkus.has(sku));
        selectedSkus.add(sku);

        const qty = Math.floor(Math.random() * 3) + 1; // 1-3 unidades
        items.push({ sku, qty });
      }

      // Método de pago aleatorio
      const paymentTypes: PaymentType[] = [
        'EFECTIVO',
        'DEBITO',
        'CREDITO',
        'TRANSFERENCIA',
        'QR',
      ];
      const paymentType: PaymentType =
        paymentTypes[Math.floor(Math.random() * paymentTypes.length)];

      salesData.push({ date: new Date(saleDate), items, paymentType });
    }
  }

  console.log(`📊 Creando ${salesData.length} ventas...`);

  for (const saleData of salesData) {
    const paymentMethodId = methodMap.get(saleData.paymentType);
    if (!paymentMethodId) continue;

    // Verificar que los productos existan
    const validItems = saleData.items.filter((item) => {
      const product = productMap.get(item.sku);
      return product !== undefined;
    });

    if (validItems.length === 0) continue;

    // Calcular total y crear items
    let total = 0;
    const itemsWithData = validItems.map((item) => {
      const product = productMap.get(item.sku)!;
      const lineTotal = Number(product.salePrice) * item.qty;
      total += lineTotal;
      return {
        productId: product.id,
        qty: item.qty,
        unitPrice: Number(product.salePrice),
        lineTotal,
        unitCostSnapshot: Number(product.purchaseCost),
      };
    });

    // Crear la venta
    await prisma.sale.create({
      data: {
        userId: owner.id,
        paymentMethodId,
        total,
        createdAt: saleData.date,
        items: {
          createMany: {
            data: itemsWithData,
          },
        },
      },
    });

    // Crear movimientos de inventario
    for (const item of itemsWithData) {
      await prisma.inventoryMovement.create({
        data: {
          productId: item.productId,
          qty: -item.qty,
          unitCost: item.unitCostSnapshot,
          type: 'SALE',
          userId: owner.id,
          createdAt: saleData.date,
        },
      });
    }
  }

  console.log(
    `✅ Seed completado: ${salesData.length} ventas agregadas durante octubre`,
  );
}

seedSales()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

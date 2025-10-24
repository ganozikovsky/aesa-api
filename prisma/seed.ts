import { PrismaClient, PaymentMethodType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const ownerUsername = process.env.SEED_OWNER_USERNAME || 'owner';
  const ownerPassword = process.env.SEED_OWNER_PASSWORD || 'Owner123!';

  const ownerHash = await bcrypt.hash(ownerPassword, 10);
  await prisma.user.upsert({
    where: { username: ownerUsername },
    update: {},
    create: { username: ownerUsername, passwordHash: ownerHash, role: 'OWNER' },
  });

  const methods: { name: string; type: PaymentMethodType }[] = [
    { name: 'Efectivo', type: 'EFECTIVO' },
    { name: 'Débito', type: 'DEBITO' },
    { name: 'Crédito', type: 'CREDITO' },
    { name: 'Transferencia', type: 'TRANSFERENCIA' },
    { name: 'QR', type: 'QR' },
  ];
  for (const m of methods) {
    await prisma.paymentMethod.upsert({
      where: { type: m.type },
      update: { name: m.name },
      create: { name: m.name, type: m.type },
    });
  }

  await prisma.court.upsert({
    where: { name: 'Cancha 1' },
    update: {},
    create: { name: 'Cancha 1' },
  });

  // Productos: Cervezas, Gaseosas y Snacks
  const products = [
    // Cervezas Premium
    {
      name: 'Cerveza Quilmes 473ml',
      sku: 'QUILMES-473',
      salePrice: 2500,
      purchaseCost: 1300,
      lowStockThreshold: 5,
    },
    {
      name: 'Cerveza Quilmes 1L',
      sku: 'QUILMES-1L',
      salePrice: 3800,
      purchaseCost: 2000,
      lowStockThreshold: 3,
    },
    {
      name: 'Cerveza Brahma 473ml',
      sku: 'BRAHMA-473',
      salePrice: 2400,
      purchaseCost: 1250,
      lowStockThreshold: 5,
    },
    {
      name: 'Cerveza Brahma 1L',
      sku: 'BRAHMA-1L',
      salePrice: 3600,
      purchaseCost: 1900,
      lowStockThreshold: 3,
    },
    {
      name: 'Cerveza Stella Artois 473ml',
      sku: 'STELLA-473',
      salePrice: 3200,
      purchaseCost: 1600,
      lowStockThreshold: 4,
    },
    {
      name: 'Cerveza Andes 473ml',
      sku: 'ANDES-473',
      salePrice: 2600,
      purchaseCost: 1350,
      lowStockThreshold: 5,
    },
    {
      name: 'Cerveza Corona 355ml',
      sku: 'CORONA-355',
      salePrice: 4000,
      purchaseCost: 2000,
      lowStockThreshold: 3,
    },

    // Gaseosas
    {
      name: 'Coca-Cola 2L',
      sku: 'COCACOLA-2L',
      salePrice: 1800,
      purchaseCost: 900,
      lowStockThreshold: 8,
    },
    {
      name: 'Coca-Cola Zero 2L',
      sku: 'COCAZERO-2L',
      salePrice: 1800,
      purchaseCost: 900,
      lowStockThreshold: 8,
    },
    {
      name: 'Sprite 2L',
      sku: 'SPRITE-2L',
      salePrice: 1600,
      purchaseCost: 800,
      lowStockThreshold: 8,
    },
    {
      name: 'Fanta Naranja 2L',
      sku: 'FANTA-NAR-2L',
      salePrice: 1400,
      purchaseCost: 700,
      lowStockThreshold: 8,
    },
    {
      name: 'Agua Mineral Glaciar 1.5L',
      sku: 'AGUA-GLACIAR',
      salePrice: 600,
      purchaseCost: 300,
      lowStockThreshold: 15,
    },

    // Snacks
    {
      name: "Papas Lay's Clásicas 80g",
      sku: 'LAYS-CLASICAS',
      salePrice: 1200,
      purchaseCost: 600,
      lowStockThreshold: 10,
    },
    {
      name: "Papas Lay's Jamón Serrano 80g",
      sku: 'LAYS-JAMON',
      salePrice: 1300,
      purchaseCost: 650,
      lowStockThreshold: 10,
    },
    {
      name: "Papas Lay's Queso y Cebolla 80g",
      sku: 'LAYS-QUESO',
      salePrice: 1300,
      purchaseCost: 650,
      lowStockThreshold: 10,
    },
    {
      name: 'Doritos Queso 80g',
      sku: 'DORITOS-QUESO',
      salePrice: 1400,
      purchaseCost: 700,
      lowStockThreshold: 8,
    },
    {
      name: 'Doritos Nacho 80g',
      sku: 'DORITOS-NACHO',
      salePrice: 1400,
      purchaseCost: 700,
      lowStockThreshold: 8,
    },
    {
      name: 'Cheetos 80g',
      sku: 'CHEETOS-80',
      salePrice: 1300,
      purchaseCost: 650,
      lowStockThreshold: 8,
    },
    {
      name: 'Maní Garbanzo 120g',
      sku: 'MANI-GARBANZO',
      salePrice: 1100,
      purchaseCost: 550,
      lowStockThreshold: 10,
    },
    {
      name: 'Mix de Frutos Secos 100g',
      sku: 'MIX-FRUTOS',
      salePrice: 2200,
      purchaseCost: 1100,
      lowStockThreshold: 6,
    },
    {
      name: 'Barra de Chocolate Milka 40g',
      sku: 'MILKA-40',
      salePrice: 800,
      purchaseCost: 400,
      lowStockThreshold: 12,
    },
    {
      name: 'Chupetín Lollipop 12g',
      sku: 'LOLLIPOP',
      salePrice: 150,
      purchaseCost: 75,
      lowStockThreshold: 20,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        name: product.name,
        sku: product.sku,
        salePrice: product.salePrice,
        purchaseCost: product.purchaseCost,
        lowStockThreshold: product.lowStockThreshold,
        active: true,
      },
    });
  }

  console.log(
    '✅ Seed completado: usuarios, métodos de pago, canchas y 24 productos',
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { InventorySyncService } from './inventory-sync.service';
import { InventoryInitializer } from './inventory-initializer';

@Module({
  imports: [PrismaModule],
  controllers: [InventoryController],
  providers: [InventoryService, InventorySyncService, InventoryInitializer],
  exports: [InventoryService, InventorySyncService],
})
export class InventoryModule {}

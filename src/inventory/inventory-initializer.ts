import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InventorySyncService } from './inventory-sync.service';

@Injectable()
export class InventoryInitializer implements OnModuleInit {
  private readonly logger = new Logger(InventoryInitializer.name);

  constructor(private readonly syncService: InventorySyncService) {}

  async onModuleInit() {
    try {
      this.logger.log('Initializing InventoryStock...');
      await this.syncService.initializeInventoryStock();
      this.logger.log('InventoryStock initialization complete');
    } catch (error) {
      this.logger.error('Failed to initialize InventoryStock', error);
      // No lanzamos error para no romper el inicio del servidor
    }
  }
}

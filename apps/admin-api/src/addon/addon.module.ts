import { Module } from '@nestjs/common';
import { AddonController } from './addon.controller.js';
import { AddonService } from './addon.service.js';
import { AddonRepository } from './addon.repository.js';

@Module({
  controllers: [AddonController],
  providers: [AddonService, AddonRepository],
  exports: [AddonService],
})
export class AddonModule {}

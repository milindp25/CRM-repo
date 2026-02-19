import { Module } from '@nestjs/common';
import { CustomFieldController } from './custom-field.controller';
import { CustomFieldService } from './custom-field.service';
import { CustomFieldRepository } from './custom-field.repository';

@Module({
  controllers: [CustomFieldController],
  providers: [CustomFieldService, CustomFieldRepository],
  exports: [CustomFieldService],
})
export class CustomFieldModule {}

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { GeofenceController } from './geofence.controller';
import { GeofenceService } from './geofence.service';
import { GeofenceRepository } from './geofence.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [GeofenceController],
  providers: [GeofenceService, GeofenceRepository, LoggerService],
  exports: [GeofenceService],
})
export class GeofenceModule {}

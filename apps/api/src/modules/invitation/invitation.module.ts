import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { InvitationController } from './invitation.controller';
import { InvitationService } from './invitation.service';
import { InvitationRepository } from './invitation.repository';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';

/**
 * Invitation Module
 * Encapsulates all invitation management functionality
 */
@Module({
  imports: [
    DatabaseModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [InvitationController],
  providers: [InvitationService, InvitationRepository, LoggerService],
  exports: [InvitationService],
})
export class InvitationModule {}

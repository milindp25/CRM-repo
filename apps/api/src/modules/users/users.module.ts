import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, LoggerService],
  exports: [UsersService],
})
export class UsersModule {}

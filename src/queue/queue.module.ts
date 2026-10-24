import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { Upload } from '../uploads/entities/upload.entity';
import { RabbitMqService } from './rabbitmq.service';
import { UploadWorker } from './upload.worker';

@Module({
  imports: [TypeOrmModule.forFeature([Upload]), StorageModule],
  providers: [RabbitMqService, UploadWorker],
  exports: [RabbitMqService],
})
export class QueueModule {}

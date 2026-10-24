import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Project } from '../projects/entities/project.entity';
import { QueueModule } from '../queue/queue.module';
import { StorageModule } from '../storage/storage.module';
import { ProjectFilesController } from './project-files.controller';
import { Upload } from './entities/upload.entity';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { AiUploadsController } from './ai-uploads.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Upload, Project]), AuthModule, StorageModule, QueueModule],
  controllers: [UploadsController, ProjectFilesController, AiUploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}

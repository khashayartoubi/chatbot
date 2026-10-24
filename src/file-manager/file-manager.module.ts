import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { UploadsModule } from '../uploads/uploads.module';
import { FileManagerController } from './file-manager.controller';
import { FileManagerService } from './file-manager.service';

@Module({
  imports: [HttpModule, AuthModule, ProjectsModule, UploadsModule],
  controllers: [FileManagerController],
  providers: [FileManagerService],
  exports: [FileManagerService],
})
export class FileManagerModule {}

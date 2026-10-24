import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { SocketModule } from '../socket/socket.module';
import { StreamModule } from '../stream/stream.module';
import { Chat } from '../stream/entities/chat.entity';
import { UploadsModule } from '../uploads/uploads.module';
import { Project } from './entities/project.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Chat]), AuthModule, StreamModule, SocketModule, UploadsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}

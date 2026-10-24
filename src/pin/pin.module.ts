import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Project } from '../projects/entities/project.entity';
import { ProjectsModule } from '../projects/projects.module';
import { SocketModule } from '../socket/socket.module';
import { Chat } from '../stream/entities/chat.entity';
import { StreamModule } from '../stream/stream.module';
import { PinController } from './pin.controller';
import { PinService } from './pin.service';

@Module({
  imports: [TypeOrmModule.forFeature([Chat, Project]), AuthModule, StreamModule, SocketModule, ProjectsModule],
  controllers: [PinController],
  providers: [PinService],
})
export class PinModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DanaModule } from '../dana/dana.module';
import { AuthModule } from '../auth/auth.module';
import { Project } from '../projects/entities/project.entity';
import { SocketModule } from '../socket/socket.module';
import { UploadsModule } from '../uploads/uploads.module';
import { ChatMessage } from './entities/chat-message.entity';
import { Chat } from './entities/chat.entity';
import { StreamService } from './stream.service';
import { StreamController } from './stream.controller';
import { StreamPayloadPipe } from './pipes/stream-payload.pipe';

@Module({
  imports: [TypeOrmModule.forFeature([Chat, ChatMessage, Project]), AuthModule, UploadsModule, DanaModule, SocketModule],
  controllers: [StreamController],
  providers: [StreamService, StreamPayloadPipe],
  exports: [StreamService],
})
export class StreamModule {}

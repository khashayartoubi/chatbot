import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AiNodePosition } from './entities/ai-node-position.entity';
import { SocketEventsService } from './services/socket-events.service';
import { SocketGateway } from './socket.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([AiNodePosition]), AuthModule],
  providers: [SocketGateway, SocketEventsService],
  exports: [SocketEventsService],
})
export class SocketModule {}

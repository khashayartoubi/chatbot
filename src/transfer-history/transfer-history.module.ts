import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { SocketModule } from '../socket/socket.module';
import { StreamModule } from '../stream/stream.module';
import { TransferHistoryController } from './transfer-history.controller';
import { TransferHistoryService } from './transfer-history.service';

@Module({
  imports: [AuthModule, ProjectsModule, StreamModule, SocketModule],
  controllers: [TransferHistoryController],
  providers: [TransferHistoryService],
})
export class TransferHistoryModule {}

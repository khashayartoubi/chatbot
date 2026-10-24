import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SocketModule } from '../socket/socket.module';
import { StreamModule } from '../stream/stream.module';
import { GeneralController } from './general.controller';
import { GeneralService } from './general.service';

@Module({
  imports: [AuthModule, StreamModule, SocketModule],
  controllers: [GeneralController],
  providers: [GeneralService],
  exports: [GeneralService],
})
export class GeneralModule {}

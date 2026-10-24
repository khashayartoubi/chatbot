import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { BackgroundController } from './background.controller';
import { BackgroundService } from './background.service';
import { Background } from './entities/background.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Background]), AuthModule, StorageModule],
  controllers: [BackgroundController],
  providers: [BackgroundService],
})
export class BackgroundModule {}

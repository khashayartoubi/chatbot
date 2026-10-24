import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UserSettings } from './entities/user-settings.entity';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserSettings]), AuthModule],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}

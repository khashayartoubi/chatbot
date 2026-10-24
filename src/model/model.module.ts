import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../projects/entities/project.entity';
import { Chat } from '../stream/entities/chat.entity';
import { ModelController } from './model.controller';
import { ModelService } from './model.service';

@Module({
  imports: [HttpModule, AuthModule, TypeOrmModule.forFeature([Chat, Project])],
  controllers: [ModelController],
  providers: [ModelService],
})
export class ModelModule {}

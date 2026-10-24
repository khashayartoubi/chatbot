import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Project } from '../projects/entities/project.entity';
import { ChatMessage } from '../stream/entities/chat-message.entity';
import { Chat } from '../stream/entities/chat.entity';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  imports: [TypeOrmModule.forFeature([Chat, ChatMessage, Project]), AuthModule],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}

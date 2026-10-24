import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Prompt } from './entities/prompt.entity';
import { PromptController } from './prompt.controller';
import { PromptService } from './prompt.service';

@Module({
  imports: [TypeOrmModule.forFeature([Prompt]), AuthModule],
  controllers: [PromptController],
  providers: [PromptService],
  exports: [PromptService],
})
export class PromptModule {}

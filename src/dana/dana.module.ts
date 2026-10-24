import { Module } from '@nestjs/common';
import { PromptModule } from '../prompt/prompt.module';
import { DanaService } from './dana.service';

@Module({
  imports: [PromptModule],
  providers: [DanaService],
  exports: [DanaService],
})
export class DanaModule {}

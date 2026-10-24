import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { Prompt } from './entities/prompt.entity';

@Injectable()
export class PromptService {
  constructor(
    @InjectRepository(Prompt)
    private readonly promptRepository: Repository<Prompt>,
    private readonly dataSource: DataSource,
    private readonly messages: I18nMessageService
  ) {}

  async create(username: string, dto: CreatePromptDto): Promise<Prompt> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const repository = manager.getRepository(Prompt);
        await repository.update({ username }, { isActive: false });
        return repository.save(
          repository.create({
            username,
            name: dto.name.trim(),
            prompt: dto.prompt.trim(),
            isActive: true,
          })
        );
      });
    } catch {
      throw this.databaseError();
    }
  }

  async findAll(username: string): Promise<Prompt[]> {
    try {
      return await this.promptRepository.find({
        where: { username },
        order: { updatedAt: 'DESC' },
      });
    } catch {
      throw this.databaseError();
    }
  }

  async findActive(username: string): Promise<Prompt | null> {
    try {
      return await this.promptRepository.findOneBy({ username, isActive: true });
    } catch {
      throw this.databaseError();
    }
  }

  async findOne(promptId: string, username: string): Promise<Prompt> {
    let prompt: Prompt | null;
    try {
      prompt = await this.promptRepository.findOneBy({
        promptId,
        username,
      });
    } catch {
      throw this.databaseError();
    }

    if (!prompt) {
      throw new NotFoundException(this.messages.translate('prompt.notFound'));
    }
    return prompt;
  }

  async update(promptId: string, username: string, dto: UpdatePromptDto): Promise<Prompt> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const repository = manager.getRepository(Prompt);
        const prompt = await repository.findOneBy({ promptId, username });
        if (!prompt) {
          throw new NotFoundException(this.messages.translate('prompt.notFound'));
        }

        await repository.update({ username }, { isActive: false });
        prompt.name = dto.name?.trim() ?? prompt.name;
        prompt.prompt = dto.prompt?.trim() ?? prompt.prompt;
        prompt.isActive = true;
        return repository.save(prompt);
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw this.databaseError();
    }
  }

  async remove(promptId: string, username: string): Promise<void> {
    const prompt = await this.findOne(promptId, username);
    try {
      await this.promptRepository.remove(prompt);
    } catch {
      throw this.databaseError();
    }
  }

  private databaseError(): ServiceUnavailableException {
    return new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
  }
}

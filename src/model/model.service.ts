import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { IsNull, Repository } from 'typeorm';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { Project } from '../projects/entities/project.entity';
import { Chat } from '../stream/entities/chat.entity';
import { ChatType } from '../stream/enums/chat-type.enum';
import type { SetModelDto } from './dto/set-model.dto';
import type { Model } from './interfaces/model.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ModelService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(Chat)
    private readonly chatsRepository: Repository<Chat>,
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    private readonly messages: I18nMessageService
  ) {}

  async getModels(): Promise<Model[]> {
    const url = this.configService.get<string>('MODEL_SERVICE_URL');
    const response = await firstValueFrom(this.httpService.get<Model[]>(`${url}/chat/api/model/getModel`));

    return response.data;
  }

  async setModel(dto: SetModelDto, username: string): Promise<number> {
    const modelName = dto.modelName.trim();
    const historyId = dto.historyId?.trim() || undefined;
    const collectionId = dto.collectionId?.trim() || undefined;
    if (!historyId && !collectionId) {
      throw new BadRequestException(this.messages.translate('model.targetRequired'));
    }

    const project = collectionId ? await this.findProject(collectionId, username) : undefined;
    if (project && !historyId) {
      try {
        const result = await this.chatsRepository.update({ username, type: ChatType.PROJECT, projectId: project.id }, { modelName });
        return result.affected ?? 0;
      } catch {
        throw this.databaseError();
      }
    }

    let chat: Chat | null;
    try {
      chat = await this.chatsRepository.findOneBy({
        username,
        type: project ? ChatType.PROJECT : ChatType.GENERAL,
        projectId: project?.id ?? IsNull(),
        ...(project ? { sessionId: historyId } : { historyId }),
      });
    } catch {
      throw this.databaseError();
    }
    if (!chat) {
      throw new NotFoundException(this.messages.translate('conversation.notFound'));
    }
    chat.modelName = modelName;
    try {
      await this.chatsRepository.save(chat);
      return 1;
    } catch {
      throw this.databaseError();
    }
  }

  private async findProject(collectionId: string, username: string): Promise<Project> {
    let project: Project | null;
    try {
      project = await this.projectsRepository.findOneBy({ collectionId, username });
    } catch {
      throw this.databaseError();
    }
    if (!project) {
      throw new NotFoundException(this.messages.translate('project.notFound'));
    }
    return project;
  }

  private databaseError(): ServiceUnavailableException {
    return new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
  }
}

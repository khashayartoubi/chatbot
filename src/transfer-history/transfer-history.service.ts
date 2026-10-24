import { BadRequestException, ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { ProjectsService } from '../projects/projects.service';
import { Project } from '../projects/entities/project.entity';
import { Chat } from '../stream/entities/chat.entity';
import { ChatType } from '../stream/enums/chat-type.enum';
import { SocketEventsService } from '../socket/services/socket-events.service';
import { StreamService } from '../stream/stream.service';
import { Upload } from '../uploads/entities/upload.entity';
import type { TransferHistoryDto } from './dto/transfer-history.dto';
import type { TransferHistoryResult } from './interfaces/transfer-history-result.interface';

@Injectable()
export class TransferHistoryService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly streamService: StreamService,
    private readonly projectsService: ProjectsService,
    private readonly socketEventsService: SocketEventsService,
    private readonly messages: I18nMessageService
  ) {}

  async transfer(dto: TransferHistoryDto, username: string): Promise<TransferHistoryResult> {
    const sourceCollectionId = dto.sourceCollectionId.trim() || undefined;
    const targetCollectionId = dto.targetCollectionId.trim() || undefined;
    const movesToGeneral = Boolean(sourceCollectionId && !targetCollectionId);

    if (!sourceCollectionId && !targetCollectionId) {
      throw new BadRequestException(this.messages.translate('conversation.transferScopeRequired'));
    }
    if (sourceCollectionId === targetCollectionId) {
      throw new ConflictException(this.messages.translate('conversation.sameProjectTransfer'));
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        const projectsRepository = manager.getRepository(Project);
        const targetProject = targetCollectionId ? await projectsRepository.findOneBy({ collectionId: targetCollectionId, username }) : undefined;
        if (targetCollectionId && !targetProject) {
          throw new NotFoundException(this.messages.translate('project.targetNotFound'));
        }

        const sourceProject = sourceCollectionId ? await projectsRepository.findOneBy({ collectionId: sourceCollectionId, username }) : undefined;
        if (sourceCollectionId && !sourceProject) {
          throw new NotFoundException(this.messages.translate('project.sourceNotFound'));
        }

        const sourceProjectId = sourceProject?.id;
        const chat = await manager.getRepository(Chat).findOneBy({
          username,
          type: sourceProjectId ? ChatType.PROJECT : ChatType.GENERAL,
          projectId: sourceProjectId ?? IsNull(),
          ...(sourceProjectId ? { sessionId: dto.historyId } : { historyId: dto.historyId }),
        });
        if (!chat) {
          throw new NotFoundException(this.messages.translate('conversation.notFound'));
        }
        const targetConversation = await manager.getRepository(Chat).findOneBy({
          username,
          type: movesToGeneral ? ChatType.GENERAL : ChatType.PROJECT,
          projectId: targetProject?.id ?? IsNull(),
          ...(movesToGeneral ? { historyId: dto.historyId } : { sessionId: dto.historyId }),
        });
        if (targetConversation) {
          throw new ConflictException(this.messages.translate('conversation.targetHistoryExists'));
        }

        if (movesToGeneral) {
          await manager.getRepository(Chat).update(chat.id, {
            type: ChatType.GENERAL,
            projectId: () => 'NULL',
            sessionId: () => 'NULL',
            historyId: dto.historyId,
          });
        } else {
          chat.type = ChatType.PROJECT;
          chat.projectId = targetProject!.id;
          chat.sessionId = dto.historyId;
          chat.historyId = undefined;
          await manager.getRepository(Chat).save(chat);
        }
        await manager.getRepository(Upload).update(
          {
            username,
            projectId: sourceProjectId ?? IsNull(),
            ...(sourceProjectId ? { sessionId: dto.historyId } : { historyId: dto.historyId }),
          },
          {
            ...(movesToGeneral
              ? {
                  projectId: () => 'NULL',
                  sessionId: () => 'NULL',
                  historyId: dto.historyId,
                }
              : {
                  projectId: targetProject!.id,
                  sessionId: dto.historyId,
                  historyId: () => 'NULL',
                }),
          }
        );
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }

    const [generalHistories, projects] = await Promise.all([this.streamService.getHistories(username), this.projectsService.getProjects(username)]);
    this.socketEventsService.history(username, generalHistories);
    this.socketEventsService.collections(username, projects);
    return {
      sourceCollectionId: sourceCollectionId ?? '',
      targetCollectionId: targetCollectionId ?? '',
      target: movesToGeneral ? 'general' : 'project',
    };
  }
}

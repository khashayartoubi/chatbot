import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { Project } from '../projects/entities/project.entity';
import { ProjectsService } from '../projects/projects.service';
import { Chat } from '../stream/entities/chat.entity';
import { ChatType } from '../stream/enums/chat-type.enum';
import { SocketEventsService } from '../socket/services/socket-events.service';
import { StreamService } from '../stream/stream.service';
import type { PinSessionDto } from './dto/pin-session.dto';
import type { PinResult } from './interfaces/pin-result.interface';

@Injectable()
export class PinService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatsRepository: Repository<Chat>,
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    private readonly streamService: StreamService,
    private readonly projectsService: ProjectsService,
    private readonly socketEventsService: SocketEventsService,
    private readonly messages: I18nMessageService
  ) {}

  async toggle(dto: PinSessionDto, username: string): Promise<PinResult> {
    if (!dto.historyId && !dto.collectionId) {
      throw new BadRequestException(this.messages.translate('pin.targetRequired'));
    }
    return dto.collectionId && !dto.historyId ? this.toggleProject(dto.collectionId, username) : this.toggleConversation(dto, username);
  }

  private async toggleProject(collectionId: string, username: string): Promise<PinResult> {
    let project: Project | null;
    try {
      project = await this.projectsRepository.findOneBy({ collectionId, username });
    } catch {
      throw this.databaseError();
    }
    if (!project) {
      throw new NotFoundException(this.messages.translate('project.notFound'));
    }

    project.pinned = !project.pinned;
    try {
      await this.projectsRepository.save(project);
    } catch {
      throw this.databaseError();
    }
    await this.emitProjects(username);
    return { collectionId, pinned: project.pinned, target: 'project' };
  }

  private async toggleConversation(dto: PinSessionDto, username: string): Promise<PinResult> {
    const historyId = dto.historyId!;
    const project = dto.collectionId ? await this.findProject(dto.collectionId, username) : undefined;
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

    chat.pinned = !chat.pinned;
    try {
      await this.chatsRepository.save(chat);
    } catch {
      throw this.databaseError();
    }
    if (project) {
      await this.emitProjects(username);
    } else {
      this.socketEventsService.history(username, await this.streamService.getHistories(username));
    }
    return {
      historyId,
      ...(dto.collectionId ? { collectionId: dto.collectionId } : {}),
      pinned: chat.pinned,
      target: 'conversation',
    };
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

  private async emitProjects(username: string): Promise<void> {
    this.socketEventsService.collections(username, await this.projectsService.getProjects(username));
  }

  private databaseError(): ServiceUnavailableException {
    return new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
  }
}

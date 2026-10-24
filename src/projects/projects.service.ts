import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'node:crypto';
import { Repository } from 'typeorm';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { LogManager } from '../common/logger/log-manager.service';
import type { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Chat } from '../stream/entities/chat.entity';
import { StreamService } from '../stream/stream.service';
import { SocketEventsService } from '../socket/services/socket-events.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(Chat)
    private readonly chatsRepository: Repository<Chat>,
    private readonly uploadsService: UploadsService,
    private readonly streamService: StreamService,
    private readonly socketEventsService: SocketEventsService,
    private readonly logger: LogManager,
    private readonly messages: I18nMessageService
  ) {}

  async create(dto: CreateProjectDto, username: string): Promise<Project> {
    const { name, color, icon } = dto.collectionData;
    this.logger.info(ProjectsService.name, 'Project creation started', {
      username,
    });
    try {
      const project = await this.projectsRepository.save(
        this.projectsRepository.create({
          name: name.trim(),
          collectionId: randomInt(10_000_000_000_000, 99_999_999_999_999).toString(),
          color,
          icon,
          username,
        })
      );
      void this.emitCollections(username);
      this.logger.info(ProjectsService.name, 'Project created', {
        username,
        collectionId: project.collectionId,
      });
      return project;
    } catch {
      throw this.databaseError();
    }
  }

  async findAll(username: string, pagination?: PaginationQueryDto): Promise<Project[]> {
    try {
      return await this.projectsRepository.find({
        where: { username },
        order: { pinned: 'DESC', createdAt: 'DESC' },
        ...(pagination ? { take: pagination.limit, skip: pagination.offset } : {}),
      });
    } catch {
      throw this.databaseError();
    }
  }

  async getProjects(username: string, pagination?: PaginationQueryDto) {
    const projects = await this.findAll(username);
    const collections = await Promise.all(
      projects.map(async (project) => ({
        collectionId: project.collectionId,
        collectionName: project.name,
        color: project.color,
        icon: project.icon,
        pinned: project.pinned,
        collectionGraph: {},
        collectionHistory: await this.streamService.getHistories(username, project.id, pagination),
        files: (await this.uploadsService.findAll(username, project.collectionId)).map((file) => file.fileId),
        prompt: '',
        state: 'done',
        waiting: false,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      }))
    );
    return {
      user_name: username,
      state: 'done',
      collections,
      createdAt: collections.at(-1)?.createdAt ?? null,
      updatedAt: collections[0]?.updatedAt ?? null,
    };
  }

  async findOwnedCollection(collectionId: string, username: string): Promise<Project> {
    let project: Project | null;
    try {
      project = await this.projectsRepository.findOneBy({
        collectionId,
        username,
      });
    } catch {
      throw this.databaseError();
    }

    if (!project) {
      throw new NotFoundException(this.messages.translate('project.notFound'));
    }
    return project;
  }

  async getMessages(username: string, collectionId: string, historyId: string, pagination?: PaginationQueryDto) {
    return this.streamService.getMessages(historyId, username, collectionId, pagination);
  }

  async updateName(collectionId: string, dto: UpdateProjectDto, username: string): Promise<Project> {
    const project = await this.findOwnedCollection(collectionId, username);
    project.name = dto.collectionData.name.trim();
    try {
      const updatedProject = await this.projectsRepository.save(project);
      void this.emitCollections(username);
      this.logger.info(ProjectsService.name, 'Project renamed', {
        username,
        collectionId,
      });
      return updatedProject;
    } catch {
      throw this.databaseError();
    }
  }

  async remove(collectionId: string, username: string): Promise<void> {
    const project = await this.findOwnedCollection(collectionId, username);
    this.logger.info(ProjectsService.name, 'Project removal started', {
      username,
      collectionId,
    });
    await this.uploadsService.removeByProject(project.id);

    try {
      await this.chatsRepository.delete({
        username,
        projectId: project.id,
      });
      await this.projectsRepository.delete(project.id);
      void this.emitCollections(username);
      this.logger.info(ProjectsService.name, 'Project removed', {
        username,
        collectionId,
      });
    } catch {
      throw this.databaseError();
    }
  }

  private databaseError(): ServiceUnavailableException {
    return new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
  }

  private async emitCollections(username: string): Promise<void> {
    try {
      this.socketEventsService.collections(username, await this.getProjects(username));
    } catch {
      return;
    }
  }
}

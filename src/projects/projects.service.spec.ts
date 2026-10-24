import type { Repository } from 'typeorm';
import type { I18nMessageService } from '../common/i18n/i18n-message.service';
import type { LogManager } from '../common/logger/log-manager.service';
import type { Chat } from '../stream/entities/chat.entity';
import type { SocketEventsService } from '../socket/services/socket-events.service';
import type { StreamService } from '../stream/stream.service';
import type { UploadsService } from '../uploads/uploads.service';
import { Project } from './entities/project.entity';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  it('returns projects ordered by creation time', async () => {
    const projects = [Object.assign(new Project(), { collectionId: 'collection-id' })];
    const find = jest.fn().mockResolvedValue(projects);
    const repository = {
      find,
    } as unknown as Repository<Project>;
    const service = new ProjectsService(
      repository,
      {} as Repository<Chat>,
      {} as UploadsService,
      {} as StreamService,
      {} as SocketEventsService,
      {} as LogManager,
      { translate: (key: string) => key } as I18nMessageService
    );

    await expect(service.findAll('user', { limit: 10, offset: 20 })).resolves.toBe(projects);
    expect(find).toHaveBeenCalledWith({
      where: { username: 'user' },
      order: { pinned: 'DESC', createdAt: 'DESC' },
      take: 10,
      skip: 20,
    });
  });

  it('returns project conversation messages without emitting a stream event', async () => {
    const messages = [{ id: 'message-id', message: 'سلام', bot: false }];
    const getMessages = jest.fn().mockResolvedValue(messages);
    const streamService = {
      getMessages,
    } as unknown as StreamService;
    const socketMessages = jest.fn();
    const socketEventsService = {
      messages: socketMessages,
    } as unknown as SocketEventsService;
    const service = new ProjectsService(
      {} as Repository<Project>,
      {} as Repository<Chat>,
      {} as UploadsService,
      streamService,
      socketEventsService,
      {} as LogManager,
      { translate: (key: string) => key } as I18nMessageService
    );

    await expect(service.getMessages('user', 'collection-id', 'history-id', { limit: 10, offset: 20 })).resolves.toBe(messages);
    expect(getMessages).toHaveBeenCalledWith('history-id', 'user', 'collection-id', { limit: 10, offset: 20 });
    expect(socketMessages).not.toHaveBeenCalled();
  });
});

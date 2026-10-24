import type { Repository } from 'typeorm';
import type { I18nMessageService } from '../common/i18n/i18n-message.service';
import { Project } from '../projects/entities/project.entity';
import type { ProjectsService } from '../projects/projects.service';
import { Chat } from '../stream/entities/chat.entity';
import { ChatType } from '../stream/enums/chat-type.enum';
import type { SocketEventsService } from '../socket/services/socket-events.service';
import type { StreamService } from '../stream/stream.service';
import { PinService } from './pin.service';

describe('PinService', () => {
  const createService = () => {
    const chat = Object.assign(new Chat(), { id: 'chat-id', pinned: false });
    const project = Object.assign(new Project(), { id: 'project-id', collectionId: 'collection-id', pinned: false });
    const findChat = jest.fn().mockResolvedValue(chat);
    const chatsRepository = {
      findOneBy: findChat,
      save: jest.fn((value: Chat) => Promise.resolve(value)),
    } as unknown as Repository<Chat>;
    const saveProject = jest.fn((value: Project) => Promise.resolve(value));
    const projectsRepository = {
      findOneBy: jest.fn().mockResolvedValue(project),
      save: saveProject,
    } as unknown as Repository<Project>;
    const getHistories = jest.fn().mockResolvedValue([]);
    const getProjects = jest.fn().mockResolvedValue({ collections: [] });
    const history = jest.fn();
    const collections = jest.fn();
    const service = new PinService(
      chatsRepository,
      projectsRepository,
      { getHistories } as unknown as StreamService,
      { getProjects } as unknown as ProjectsService,
      { history, collections } as unknown as SocketEventsService,
      { translate: (key: string) => key } as I18nMessageService
    );
    return { service, findChat, saveProject, history, collections };
  };

  it('pins a general conversation when only historyId is provided', async () => {
    const { service, findChat, history } = createService();

    await expect(service.toggle({ historyId: 'history-id' }, 'user')).resolves.toEqual({
      historyId: 'history-id',
      pinned: true,
      target: 'conversation',
    });
    expect(findChat).toHaveBeenCalledWith(expect.objectContaining({ username: 'user', type: ChatType.GENERAL, historyId: 'history-id' }));
    expect(history).toHaveBeenCalledWith('user', []);
  });

  it('pins a project when only collectionId is provided', async () => {
    const { service, saveProject, collections } = createService();

    await expect(service.toggle({ collectionId: 'collection-id' }, 'user')).resolves.toEqual({
      collectionId: 'collection-id',
      pinned: true,
      target: 'project',
    });
    expect(saveProject).toHaveBeenCalledWith(expect.objectContaining({ pinned: true }));
    expect(collections).toHaveBeenCalledWith('user', { collections: [] });
  });

  it('pins a project conversation when historyId and collectionId are provided', async () => {
    const { service, findChat, collections } = createService();

    await expect(service.toggle({ historyId: 'history-id', collectionId: 'collection-id' }, 'user')).resolves.toEqual({
      historyId: 'history-id',
      collectionId: 'collection-id',
      pinned: true,
      target: 'conversation',
    });
    expect(findChat).toHaveBeenCalledWith({
      username: 'user',
      type: ChatType.PROJECT,
      projectId: 'project-id',
      sessionId: 'history-id',
    });
    expect(collections).toHaveBeenCalledWith('user', { collections: [] });
  });
});

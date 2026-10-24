import type { DataSource } from 'typeorm';
import type { I18nMessageService } from '../common/i18n/i18n-message.service';
import { Project } from '../projects/entities/project.entity';
import type { ProjectsService } from '../projects/projects.service';
import { Chat } from '../stream/entities/chat.entity';
import { ChatType } from '../stream/enums/chat-type.enum';
import type { SocketEventsService } from '../socket/services/socket-events.service';
import type { StreamService } from '../stream/stream.service';
import { Upload } from '../uploads/entities/upload.entity';
import { TransferHistoryService } from './transfer-history.service';

describe('TransferHistoryService', () => {
  const createService = (sourceProject?: Project) => {
    const targetProject = Object.assign(new Project(), { id: 'target-id', collectionId: 'target-collection' });
    const chat = Object.assign(new Chat(), {
      id: 'chat-id',
      type: sourceProject ? ChatType.PROJECT : ChatType.GENERAL,
      projectId: sourceProject?.id,
      historyId: sourceProject ? undefined : 'history-id',
      sessionId: sourceProject ? 'history-id' : undefined,
    });
    const projectsRepository = {
      findOneBy: jest.fn(({ collectionId }: { collectionId: string }) => Promise.resolve(collectionId === targetProject.collectionId ? targetProject : (sourceProject ?? null))),
    };
    const chatsRepository = {
      findOneBy: jest.fn().mockResolvedValueOnce(chat).mockResolvedValueOnce(null),
      save: jest.fn().mockResolvedValue(chat),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const uploadsRepository = {
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === Project) return projectsRepository;
        if (entity === Chat) return chatsRepository;
        if (entity === Upload) return uploadsRepository;
        throw new Error('Unexpected repository');
      }),
    };
    const transaction = jest.fn((callback: (value: typeof manager) => Promise<void>) => callback(manager));
    const history = jest.fn();
    const collections = jest.fn();
    const service = new TransferHistoryService(
      { transaction } as unknown as DataSource,
      { getHistories: jest.fn().mockResolvedValue([]) } as unknown as StreamService,
      { getProjects: jest.fn().mockResolvedValue({ collections: [] }) } as unknown as ProjectsService,
      { history, collections } as unknown as SocketEventsService,
      { translate: (key: string) => key } as I18nMessageService
    );
    return { service, chat, chatsRepository, uploadsRepository, transaction, history, collections };
  };

  it('moves a general conversation and its files into a project', async () => {
    const { service, chat, chatsRepository, uploadsRepository, history, collections } = createService();

    await service.transfer({ historyId: 'history-id', sourceCollectionId: '', targetCollectionId: 'target-collection' }, 'user');

    expect(chatsRepository.findOneBy).toHaveBeenCalledWith(expect.objectContaining({ username: 'user', type: ChatType.GENERAL, historyId: 'history-id' }));
    expect(chat).toMatchObject({ type: ChatType.PROJECT, projectId: 'target-id', sessionId: 'history-id', historyId: undefined });
    expect(uploadsRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'user', historyId: 'history-id' }),
      expect.objectContaining({ projectId: 'target-id', sessionId: 'history-id' })
    );
    expect(history).toHaveBeenCalledWith('user', []);
    expect(collections).toHaveBeenCalledWith('user', { collections: [] });
  });

  it('moves a project conversation and its files into another project', async () => {
    const sourceProject = Object.assign(new Project(), { id: 'source-id', collectionId: 'source-collection' });
    const { service, chatsRepository, uploadsRepository } = createService(sourceProject);

    await service.transfer(
      {
        historyId: 'history-id',
        sourceCollectionId: 'source-collection',
        targetCollectionId: 'target-collection',
      },
      'user'
    );

    expect(chatsRepository.findOneBy).toHaveBeenCalledWith({
      username: 'user',
      type: ChatType.PROJECT,
      projectId: 'source-id',
      sessionId: 'history-id',
    });
    expect(uploadsRepository.update).toHaveBeenCalledWith(
      { username: 'user', projectId: 'source-id', sessionId: 'history-id' },
      expect.objectContaining({ projectId: 'target-id', sessionId: 'history-id' })
    );
  });

  it('moves a project conversation and its files into General', async () => {
    const sourceProject = Object.assign(new Project(), { id: 'source-id', collectionId: 'source-collection' });
    const { service, chatsRepository, uploadsRepository } = createService(sourceProject);

    await expect(
      service.transfer(
        {
          historyId: 'history-id',
          sourceCollectionId: 'source-collection',
          targetCollectionId: '',
        },
        'user'
      )
    ).resolves.toEqual({ sourceCollectionId: 'source-collection', targetCollectionId: '', target: 'general' });
    expect(chatsRepository.update).toHaveBeenCalledWith('chat-id', expect.objectContaining({ type: ChatType.GENERAL, historyId: 'history-id' }));
    expect(uploadsRepository.update).toHaveBeenCalledWith(
      { username: 'user', projectId: 'source-id', sessionId: 'history-id' },
      expect.objectContaining({ historyId: 'history-id' })
    );
  });

  it('rejects a transfer when source and target projects are the same', async () => {
    const { service, transaction } = createService();

    await expect(
      service.transfer(
        {
          historyId: 'history-id',
          sourceCollectionId: 'same-collection',
          targetCollectionId: 'same-collection',
        },
        'user'
      )
    ).rejects.toMatchObject({ status: 409, message: 'conversation.sameProjectTransfer' });
    expect(transaction).not.toHaveBeenCalled();
  });
});

import type { HttpService } from '@nestjs/axios';
import type { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import type { Repository } from 'typeorm';
import type { I18nMessageService } from '../common/i18n/i18n-message.service';
import { Project } from '../projects/entities/project.entity';
import { Chat } from '../stream/entities/chat.entity';
import { ModelService } from './model.service';

describe('ModelService', () => {
  it('returns model data from the model service', async () => {
    const models = [{ id: 'model-id', name: 'GPT' }];
    const get = jest.fn().mockReturnValue(of({ data: models }));
    const configService = {
      get: jest.fn().mockReturnValue('http://127.0.0.1:4400'),
    } as unknown as ConfigService;
    const service = new ModelService({ get } as unknown as HttpService, configService, {} as Repository<Chat>, {} as Repository<Project>, {} as I18nMessageService);

    await expect(service.getModels()).resolves.toEqual(models);
    expect(get).toHaveBeenCalledWith('http://127.0.0.1:4400/chat/api/model/getModel');
  });

  it('sets the model for one general conversation', async () => {
    const chat = Object.assign(new Chat(), { id: 'chat-id', modelName: 'old-model' });
    const save = jest.fn((value: Chat) => Promise.resolve(value));
    const service = new ModelService(
      {} as HttpService,
      {} as ConfigService,
      { findOneBy: jest.fn().mockResolvedValue(chat), save } as unknown as Repository<Chat>,
      {} as Repository<Project>,
      { translate: (key: string) => key } as I18nMessageService
    );

    await expect(service.setModel({ modelName: 'new-model', historyId: 'history-id' }, 'user')).resolves.toBe(1);
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ id: 'chat-id', modelName: 'new-model' }));
  });

  it('sets the model for every conversation in a project', async () => {
    const update = jest.fn().mockResolvedValue({ affected: 3 });
    const service = new ModelService(
      {} as HttpService,
      {} as ConfigService,
      { update } as unknown as Repository<Chat>,
      { findOneBy: jest.fn().mockResolvedValue(Object.assign(new Project(), { id: 'project-id' })) } as unknown as Repository<Project>,
      { translate: (key: string) => key } as I18nMessageService
    );

    await expect(service.setModel({ modelName: 'new-model', collectionId: 'collection-id' }, 'user')).resolves.toBe(3);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ username: 'user', projectId: 'project-id' }), { modelName: 'new-model' });
  });
});

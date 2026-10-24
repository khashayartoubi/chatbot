import type { DataSource, Repository } from 'typeorm';
import type { I18nMessageService } from '../common/i18n/i18n-message.service';
import { Prompt } from './entities/prompt.entity';
import { PromptService } from './prompt.service';

describe('PromptService', () => {
  const createService = (existingPrompt?: Prompt) => {
    const repository = {
      create: jest.fn((value: Partial<Prompt>) => Object.assign(new Prompt(), value)),
      save: jest.fn((value: Prompt) => Promise.resolve(value)),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      findOneBy: jest.fn().mockResolvedValue(existingPrompt ?? null),
    };
    const manager = { getRepository: jest.fn().mockReturnValue(repository) };
    const dataSource = {
      transaction: jest.fn((callback: (value: typeof manager) => Promise<Prompt>) => callback(manager)),
    } as unknown as DataSource;
    const service = new PromptService(repository as unknown as Repository<Prompt>, dataSource, { translate: (key: string) => key } as I18nMessageService);
    return { service, repository };
  };

  it('trims and saves a new prompt as the only active prompt', async () => {
    const { service, repository } = createService();

    const result = await service.create('user', {
      name: '  Summary  ',
      prompt: '  Summarize this  ',
    });

    expect(repository.update).toHaveBeenCalledWith({ username: 'user' }, { isActive: false });
    expect(result).toMatchObject({
      username: 'user',
      name: 'Summary',
      prompt: 'Summarize this',
      isActive: true,
    });
  });

  it('activates an updated prompt and deactivates the other user prompts', async () => {
    const prompt = Object.assign(new Prompt(), {
      promptId: 'prompt-id',
      username: 'user',
      name: 'Old name',
      prompt: 'Old prompt',
      isActive: false,
    });
    const { service, repository } = createService(prompt);

    const result = await service.update('prompt-id', 'user', {
      name: 'New name',
      prompt: 'New prompt',
    });

    expect(repository.update).toHaveBeenCalledWith({ username: 'user' }, { isActive: false });
    expect(result).toMatchObject({ name: 'New name', prompt: 'New prompt', isActive: true });
  });
});

import type { Repository } from 'typeorm';
import type { I18nMessageService } from '../common/i18n/i18n-message.service';
import type { MinioService } from '../storage/minio.service';
import { Background } from './entities/background.entity';
import { BackgroundFit } from './enums/background-fit.enum';
import { BackgroundService } from './background.service';

describe('BackgroundService', () => {
  it('creates default background settings when none exist', async () => {
    const create = jest.fn((value: Partial<Background>) => Object.assign(new Background(), value));
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create,
      save: jest.fn((value: Background) => Promise.resolve(value)),
    } as unknown as Repository<Background>;
    const service = new BackgroundService(
      repository,
      {} as MinioService,
      {
        translate: (key: string) => key,
      } as I18nMessageService
    );

    await expect(service.get('user')).resolves.toMatchObject({ username: 'user' });
    expect(create).toHaveBeenCalledWith({ username: 'user' });
  });

  it('updates and returns background display settings', async () => {
    const background = Object.assign(new Background(), {
      username: 'user',
      enabled: true,
      fit: BackgroundFit.COVER,
      overlay: '#F5827A66',
      blur: true,
      applyToAll: true,
    });
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(background),
      save: jest.fn((value: Background) => Promise.resolve(value)),
    } as unknown as Repository<Background>;
    const service = new BackgroundService(repository, {} as MinioService, { translate: (key: string) => key } as I18nMessageService);

    await expect(
      service.update('user', {
        enabled: false,
        fit: BackgroundFit.CONTAIN,
        overlay: '#00000080',
        blur: false,
        applyToAll: false,
      })
    ).resolves.toMatchObject({
      enabled: false,
      fit: BackgroundFit.CONTAIN,
      overlay: '#00000080',
      blur: false,
      applyToAll: false,
    });
  });
});

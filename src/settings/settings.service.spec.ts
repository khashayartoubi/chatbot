import type { Repository } from 'typeorm';
import type { I18nMessageService } from '../common/i18n/i18n-message.service';
import { DefaultLanguage } from './enums/default-language.enum';
import { FontSize } from './enums/font-size.enum';
import { UserSettings } from './entities/user-settings.entity';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  it('updates user settings', async () => {
    const settings = Object.assign(new UserSettings(), {
      username: 'user',
      fontSize: FontSize.MEDIUM,
      defaultLanguage: DefaultLanguage.PERSIAN,
    });
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(settings),
      save: jest.fn((value: UserSettings) => Promise.resolve(value)),
    } as unknown as Repository<UserSettings>;
    const service = new SettingsService(repository, { translate: (key: string) => key } as I18nMessageService);

    const result = await service.update('user', {
      fontSize: FontSize.LARGE,
      defaultLanguage: DefaultLanguage.ENGLISH,
    });

    expect(result).toMatchObject({
      fontSize: FontSize.LARGE,
      defaultLanguage: DefaultLanguage.ENGLISH,
    });
  });
});

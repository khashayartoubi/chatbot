import type { I18nService } from 'nestjs-i18n';
import { I18nMessageService } from './i18n-message.service';

describe('I18nMessageService', () => {
  it('isolates the selected language between requests', () => {
    const translate = jest.fn((_key: string, options?: { lang?: string }) => options?.lang ?? '');
    const service = new I18nMessageService({ translate } as unknown as I18nService);

    const english = service.runInRequest(() => {
      service.setLanguage('en');
      return service.translate('settings.updated');
    });
    const persian = service.runInRequest(() => service.translate('settings.updated'));

    expect(english).toBe('en');
    expect(persian).toBe('fa');
  });
});

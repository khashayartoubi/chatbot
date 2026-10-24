import { Injectable } from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { AsyncLocalStorage } from 'node:async_hooks';
import { Language } from './enums/language.enum';
import type { LanguageStore } from './interfaces/language-store.interface';

@Injectable()
export class I18nMessageService {
  private readonly languageContext = new AsyncLocalStorage<LanguageStore>();

  constructor(private readonly i18n: I18nService) {}

  runInRequest<T>(callback: () => T): T {
    return this.languageContext.run({ language: Language.PERSIAN }, callback);
  }

  setLanguage(language: string): void {
    const store = this.languageContext.getStore();
    if (store) {
      store.language = language === String(Language.ENGLISH) ? Language.ENGLISH : Language.PERSIAN;
    }
  }

  translate(key: string): string {
    const language = this.languageContext.getStore()?.language ?? I18nContext.current()?.lang ?? Language.PERSIAN;
    return this.i18n.translate(`messages.${key}`, language ? { lang: language } : undefined);
  }
}

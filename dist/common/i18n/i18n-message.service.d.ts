import { I18nService } from 'nestjs-i18n';
export declare class I18nMessageService {
    private readonly i18n;
    private readonly languageContext;
    constructor(i18n: I18nService);
    runInRequest<T>(callback: () => T): T;
    setLanguage(language: string): void;
    translate(key: string): string;
}

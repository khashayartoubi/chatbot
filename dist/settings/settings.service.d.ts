import { Repository } from 'typeorm';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UserSettings } from './entities/user-settings.entity';
export declare class SettingsService {
    private readonly settingsRepository;
    private readonly messages;
    constructor(settingsRepository: Repository<UserSettings>, messages: I18nMessageService);
    get(username: string): Promise<UserSettings>;
    update(username: string, dto: UpdateSettingsDto): Promise<UserSettings>;
    private databaseError;
}

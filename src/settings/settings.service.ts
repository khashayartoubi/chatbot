import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UserSettings } from './entities/user-settings.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(UserSettings)
    private readonly settingsRepository: Repository<UserSettings>,
    private readonly messages: I18nMessageService
  ) {}

  async get(username: string): Promise<UserSettings> {
    try {
      const settings = await this.settingsRepository.findOneBy({ username });
      return settings ?? this.settingsRepository.save(this.settingsRepository.create({ username }));
    } catch {
      throw this.databaseError();
    }
  }

  async update(username: string, dto: UpdateSettingsDto): Promise<UserSettings> {
    const settings = await this.get(username);
    settings.fontSize = dto.fontSize ?? settings.fontSize;
    settings.defaultLanguage = dto.defaultLanguage ?? settings.defaultLanguage;
    try {
      return await this.settingsRepository.save(settings);
    } catch {
      throw this.databaseError();
    }
  }

  private databaseError(): ServiceUnavailableException {
    return new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
  }
}

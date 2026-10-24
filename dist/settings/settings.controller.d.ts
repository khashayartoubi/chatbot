import { HttpStatus } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';
export declare class SettingsController {
    private readonly settingsService;
    private readonly messages;
    constructor(settingsService: SettingsService, messages: I18nMessageService);
    get(request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: import("./entities/user-settings.entity").UserSettings;
    }>;
    update(dto: UpdateSettingsDto, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: import("./entities/user-settings.entity").UserSettings;
    }>;
}

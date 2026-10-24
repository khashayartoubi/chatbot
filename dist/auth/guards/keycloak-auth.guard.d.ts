import { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { ActiveSessionService } from '../services/active-session.service';
import { UserManagementService } from '../services/user-management.service';
import { I18nMessageService } from '../../common/i18n/i18n-message.service';
import { LogManager } from '../../common/logger/log-manager.service';
import { UserSettings } from '../../settings/entities/user-settings.entity';
export declare class KeycloakAuthGuard implements CanActivate {
    private readonly userManagementService;
    private readonly activeSessionService;
    private readonly logger;
    private readonly messages;
    private readonly settingsRepository;
    constructor(userManagementService: UserManagementService, activeSessionService: ActiveSessionService, logger: LogManager, messages: I18nMessageService, settingsRepository: Repository<UserSettings>);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractBearerToken;
    private getClientIp;
    private unauthorized;
    private setUserLanguage;
}

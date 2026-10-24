import { ConfigService } from '@nestjs/config';
import { I18nMessageService } from '../../common/i18n/i18n-message.service';
import { LogManager } from '../../common/logger/log-manager.service';
import type { KeycloakUser } from '../interfaces/keycloak-user.interface';
export declare class UserManagementService {
    private readonly configService;
    private readonly logger;
    private readonly messages;
    constructor(configService: ConfigService, logger: LogManager, messages: I18nMessageService);
    fetchUserInfo(token: string): Promise<KeycloakUser>;
    private buildUrl;
    private ensureTrailingSlash;
    private extractUser;
    private unauthorized;
}

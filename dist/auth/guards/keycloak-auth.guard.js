"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var KeycloakAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeycloakAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const active_session_service_1 = require("../services/active-session.service");
const user_management_service_1 = require("../services/user-management.service");
const i18n_message_service_1 = require("../../common/i18n/i18n-message.service");
const log_manager_service_1 = require("../../common/logger/log-manager.service");
const user_settings_entity_1 = require("../../settings/entities/user-settings.entity");
let KeycloakAuthGuard = KeycloakAuthGuard_1 = class KeycloakAuthGuard {
    userManagementService;
    activeSessionService;
    logger;
    messages;
    settingsRepository;
    constructor(userManagementService, activeSessionService, logger, messages, settingsRepository) {
        this.userManagementService = userManagementService;
        this.activeSessionService = activeSessionService;
        this.logger = logger;
        this.messages = messages;
        this.settingsRepository = settingsRepository;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const clientIp = this.getClientIp(request);
        this.logger.trace(KeycloakAuthGuard_1.name, 'Authentication started', {
            method: request.method,
            path: request.url,
            ip: clientIp,
        });
        const token = this.extractBearerToken(request.headers.authorization);
        const currentUser = await this.userManagementService.fetchUserInfo(token);
        await this.setUserLanguage(currentUser.username);
        request.userName = currentUser.username;
        request.userInfo = currentUser;
        request.token = token;
        this.logger.trace(KeycloakAuthGuard_1.name, 'Authentication completed', {
            username: currentUser.username,
            method: request.method,
            path: request.url,
        });
        return true;
    }
    extractBearerToken(authorization) {
        if (!authorization) {
            throw this.unauthorized(this.messages.translate('auth.loginRequired'));
        }
        const [scheme, token, ...rest] = authorization.trim().split(/\s+/);
        if (scheme?.toLowerCase() !== 'bearer' || !token || rest.length > 0) {
            throw this.unauthorized(this.messages.translate('auth.invalidTokenStructure'));
        }
        return token;
    }
    getClientIp(request) {
        const forwardedFor = request.headers['x-forwarded-for'];
        const forwardedIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(',')[0]?.trim();
        return (forwardedIp || request.ip || request.socket.remoteAddress || '').replace('::ffff:', '');
    }
    unauthorized(message) {
        return new common_1.UnauthorizedException({
            success: false,
            status: 401,
            isAuth: false,
            message,
        });
    }
    async setUserLanguage(username) {
        try {
            const settings = await this.settingsRepository.findOneBy({ username });
            this.messages.setLanguage(settings?.defaultLanguage ?? 'fa');
        }
        catch (error) {
            this.messages.setLanguage('fa');
            this.logger.failure(KeycloakAuthGuard_1.name, 'Could not load user language; using fallback', error, {
                username,
                fallbackLanguage: 'fa',
            });
        }
    }
};
exports.KeycloakAuthGuard = KeycloakAuthGuard;
exports.KeycloakAuthGuard = KeycloakAuthGuard = KeycloakAuthGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, typeorm_1.InjectRepository)(user_settings_entity_1.UserSettings)),
    __metadata("design:paramtypes", [user_management_service_1.UserManagementService,
        active_session_service_1.ActiveSessionService,
        log_manager_service_1.LogManager,
        i18n_message_service_1.I18nMessageService, Function])
], KeycloakAuthGuard);
//# sourceMappingURL=keycloak-auth.guard.js.map
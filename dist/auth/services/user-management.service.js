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
var UserManagementService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManagementService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const i18n_message_service_1 = require("../../common/i18n/i18n-message.service");
const log_manager_service_1 = require("../../common/logger/log-manager.service");
let UserManagementService = UserManagementService_1 = class UserManagementService {
    configService;
    logger;
    messages;
    constructor(configService, logger, messages) {
        this.configService = configService;
        this.logger = logger;
        this.messages = messages;
    }
    async fetchUserInfo(token) {
        const url = this.buildUrl('users/subproject/auth');
        const startedAt = Date.now();
        this.logger.trace(UserManagementService_1.name, 'User profile request started');
        let response;
        try {
            response = await fetch(url, {
                method: 'POST',
                headers: {
                    authorization: `Bearer ${token}`,
                    accept: 'application/json',
                    'content-type': 'application/json',
                },
                body: JSON.stringify({}),
                signal: AbortSignal.timeout(10_000),
            });
        }
        catch (error) {
            this.logger.failure(UserManagementService_1.name, 'User profile service is unavailable', error, {
                durationMs: Date.now() - startedAt,
            });
            throw new common_1.BadGatewayException(this.messages.translate('auth.serviceUnavailable'));
        }
        if (response.status === 401 || response.status === 403) {
            this.logger.warning(UserManagementService_1.name, 'User profile request rejected', {
                status: response.status,
                durationMs: Date.now() - startedAt,
            });
            throw this.unauthorized(this.messages.translate('auth.invalidToken'));
        }
        if (!response.ok) {
            this.logger.warning(UserManagementService_1.name, 'User profile service returned an invalid status', {
                status: response.status,
                durationMs: Date.now() - startedAt,
            });
            throw new common_1.BadGatewayException(this.messages.translate('auth.invalidResponse'));
        }
        const responseText = await response.text();
        if (!responseText.trim()) {
            throw new common_1.BadGatewayException(this.messages.translate('auth.emptyResponse'));
        }
        let body;
        try {
            body = JSON.parse(responseText);
        }
        catch {
            throw new common_1.BadGatewayException(this.messages.translate('auth.malformedResponse'));
        }
        const user = this.extractUser(body);
        if (!user?.username) {
            throw this.unauthorized(this.messages.translate('auth.userNotFound'));
        }
        this.logger.trace(UserManagementService_1.name, 'User profile received', {
            username: user.username,
            durationMs: Date.now() - startedAt,
        });
        return user;
    }
    buildUrl(path) {
        const baseUrl = this.configService.get('KEYCLOAK_SERVER_URL_CHATBOT');
        if (!baseUrl) {
            throw new Error('KEYCLOAK_SERVER_URL_CHATBOT is not configured');
        }
        return new URL(path.replace(/^\/+/, ''), this.ensureTrailingSlash(baseUrl)).toString();
    }
    ensureTrailingSlash(value) {
        return value.endsWith('/') ? value : `${value}/`;
    }
    extractUser(body) {
        if ('username' in body) {
            return body;
        }
        if (body.profile) {
            return body.profile;
        }
        if (!body.data) {
            return undefined;
        }
        return 'username' in body.data ? body.data : body.data.data;
    }
    unauthorized(message) {
        return new common_1.UnauthorizedException(message);
    }
};
exports.UserManagementService = UserManagementService;
exports.UserManagementService = UserManagementService = UserManagementService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        log_manager_service_1.LogManager,
        i18n_message_service_1.I18nMessageService])
], UserManagementService);
//# sourceMappingURL=user-management.service.js.map
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const user_settings_entity_1 = require("./entities/user-settings.entity");
let SettingsService = class SettingsService {
    settingsRepository;
    messages;
    constructor(settingsRepository, messages) {
        this.settingsRepository = settingsRepository;
        this.messages = messages;
    }
    async get(username) {
        try {
            const settings = await this.settingsRepository.findOneBy({ username });
            return settings ?? this.settingsRepository.save(this.settingsRepository.create({ username }));
        }
        catch {
            throw this.databaseError();
        }
    }
    async update(username, dto) {
        const settings = await this.get(username);
        settings.fontSize = dto.fontSize ?? settings.fontSize;
        settings.defaultLanguage = dto.defaultLanguage ?? settings.defaultLanguage;
        try {
            return await this.settingsRepository.save(settings);
        }
        catch {
            throw this.databaseError();
        }
    }
    databaseError() {
        return new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_settings_entity_1.UserSettings)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        i18n_message_service_1.I18nMessageService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map
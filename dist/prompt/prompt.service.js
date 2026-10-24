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
exports.PromptService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const prompt_entity_1 = require("./entities/prompt.entity");
let PromptService = class PromptService {
    promptRepository;
    dataSource;
    messages;
    constructor(promptRepository, dataSource, messages) {
        this.promptRepository = promptRepository;
        this.dataSource = dataSource;
        this.messages = messages;
    }
    async create(username, dto) {
        try {
            return await this.dataSource.transaction(async (manager) => {
                const repository = manager.getRepository(prompt_entity_1.Prompt);
                await repository.update({ username }, { isActive: false });
                return repository.save(repository.create({
                    username,
                    name: dto.name.trim(),
                    prompt: dto.prompt.trim(),
                    isActive: true,
                }));
            });
        }
        catch {
            throw this.databaseError();
        }
    }
    async findAll(username) {
        try {
            return await this.promptRepository.find({
                where: { username },
                order: { updatedAt: 'DESC' },
            });
        }
        catch {
            throw this.databaseError();
        }
    }
    async findActive(username) {
        try {
            return await this.promptRepository.findOneBy({ username, isActive: true });
        }
        catch {
            throw this.databaseError();
        }
    }
    async findOne(promptId, username) {
        let prompt;
        try {
            prompt = await this.promptRepository.findOneBy({
                promptId,
                username,
            });
        }
        catch {
            throw this.databaseError();
        }
        if (!prompt) {
            throw new common_1.NotFoundException(this.messages.translate('prompt.notFound'));
        }
        return prompt;
    }
    async update(promptId, username, dto) {
        try {
            return await this.dataSource.transaction(async (manager) => {
                const repository = manager.getRepository(prompt_entity_1.Prompt);
                const prompt = await repository.findOneBy({ promptId, username });
                if (!prompt) {
                    throw new common_1.NotFoundException(this.messages.translate('prompt.notFound'));
                }
                await repository.update({ username }, { isActive: false });
                prompt.name = dto.name?.trim() ?? prompt.name;
                prompt.prompt = dto.prompt?.trim() ?? prompt.prompt;
                prompt.isActive = true;
                return repository.save(prompt);
            });
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw this.databaseError();
        }
    }
    async remove(promptId, username) {
        const prompt = await this.findOne(promptId, username);
        try {
            await this.promptRepository.remove(prompt);
        }
        catch {
            throw this.databaseError();
        }
    }
    databaseError() {
        return new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }
};
exports.PromptService = PromptService;
exports.PromptService = PromptService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(prompt_entity_1.Prompt)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource,
        i18n_message_service_1.I18nMessageService])
], PromptService);
//# sourceMappingURL=prompt.service.js.map
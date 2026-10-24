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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const pdfkit_1 = __importDefault(require("pdfkit"));
const typeorm_2 = require("typeorm");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const project_entity_1 = require("../projects/entities/project.entity");
const chat_message_entity_1 = require("../stream/entities/chat-message.entity");
const chat_entity_1 = require("../stream/entities/chat.entity");
const chat_type_enum_1 = require("../stream/enums/chat-type.enum");
const export_format_enum_1 = require("./enums/export-format.enum");
let ExportService = class ExportService {
    chatsRepository;
    messagesRepository;
    projectsRepository;
    i18nMessages;
    constructor(chatsRepository, messagesRepository, projectsRepository, i18nMessages) {
        this.chatsRepository = chatsRepository;
        this.messagesRepository = messagesRepository;
        this.projectsRepository = projectsRepository;
        this.i18nMessages = i18nMessages;
    }
    async export(dto, username) {
        const projectId = await this.getProjectId(dto.collectionId, username);
        let chat;
        let messages;
        try {
            chat = await this.chatsRepository.findOne({
                where: {
                    username,
                    type: projectId ? chat_type_enum_1.ChatType.PROJECT : chat_type_enum_1.ChatType.GENERAL,
                    projectId: projectId ?? (0, typeorm_2.IsNull)(),
                    ...(projectId ? { sessionId: dto.historyId } : { historyId: dto.historyId }),
                },
            });
            if (!chat) {
                throw new common_1.NotFoundException(this.i18nMessages.translate('conversation.notFound'));
            }
            messages = await this.messagesRepository.find({
                where: { chatId: chat.id },
                order: { sequence: 'ASC' },
            });
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.ServiceUnavailableException(this.i18nMessages.translate('common.databaseUnavailable'));
        }
        const text = this.toText(chat, messages);
        const filename = `session-${dto.historyId}.${dto.format}`;
        if (dto.format === export_format_enum_1.ExportFormat.TEXT) {
            return {
                content: Buffer.from(text, 'utf8'),
                filename,
                mimeType: 'text/plain; charset=utf-8',
            };
        }
        return {
            content: await this.toPdf(text),
            filename,
            mimeType: 'application/pdf',
        };
    }
    async getProjectId(collectionId, username) {
        if (!collectionId) {
            return undefined;
        }
        let project;
        try {
            project = await this.projectsRepository.findOneBy({
                collectionId,
                username,
            });
        }
        catch {
            throw new common_1.ServiceUnavailableException(this.i18nMessages.translate('common.databaseUnavailable'));
        }
        if (!project) {
            throw new common_1.NotFoundException(this.i18nMessages.translate('project.notFound'));
        }
        return project.id;
    }
    toText(chat, messages) {
        const title = chat.historyName || `گفتگو ${chat.historyId ?? chat.sessionId ?? chat.id}`;
        const body = messages.map((message) => {
            const sender = message.bot ? 'دستیار' : 'کاربر';
            const createdAt = new Date(message.createdAt).toISOString();
            return `${sender} - ${createdAt}\n${message.message}`;
        });
        return [title, '', ...body.flatMap((message) => [message, ''])].join('\n');
    }
    toPdf(text) {
        return new Promise((resolve, reject) => {
            const document = new pdfkit_1.default({
                size: 'A4',
                margin: 50,
                info: { Title: 'Chat session' },
            });
            const chunks = [];
            document.on('data', (chunk) => chunks.push(chunk));
            document.on('end', () => resolve(Buffer.concat(chunks)));
            document.on('error', reject);
            document.font(require.resolve('@fontsource/vazirmatn/files/vazirmatn-arabic-400-normal.woff'));
            document.fontSize(11).text(text, {
                align: 'right',
                features: ['rtla'],
                lineGap: 5,
            });
            document.end();
        });
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(chat_entity_1.Chat)),
    __param(1, (0, typeorm_1.InjectRepository)(chat_message_entity_1.ChatMessage)),
    __param(2, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        i18n_message_service_1.I18nMessageService])
], ExportService);
//# sourceMappingURL=export.service.js.map
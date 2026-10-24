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
var StreamService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const node_crypto_1 = require("node:crypto");
const typeorm_2 = require("typeorm");
const log_manager_service_1 = require("../common/logger/log-manager.service");
const i18n_message_service_1 = require("../common/i18n/i18n-message.service");
const external_http_exception_1 = require("../common/http/external-http-exception");
const dana_service_1 = require("../dana/dana.service");
const project_entity_1 = require("../projects/entities/project.entity");
const uploads_service_1 = require("../uploads/uploads.service");
const selection_mode_history_title_constant_1 = require("./constants/selection-mode-history-title.constant");
const chat_message_entity_1 = require("./entities/chat-message.entity");
const chat_entity_1 = require("./entities/chat.entity");
const chat_type_enum_1 = require("./enums/chat-type.enum");
const stream_message_type_enum_1 = require("./enums/stream-message-type.enum");
const answer_status_enum_1 = require("./enums/answer-status.enum");
const stream_scope_enum_1 = require("./enums/stream-scope.enum");
const selection_mode_enum_1 = require("./enums/selection-mode.enum");
const socket_events_service_1 = require("../socket/services/socket-events.service");
let StreamService = StreamService_1 = class StreamService {
    chatsRepository;
    messagesRepository;
    projectsRepository;
    dataSource;
    uploadsService;
    danaService;
    socketEventsService;
    logger;
    messages;
    configService;
    activeStreams = new Map();
    activeStreamControllers = new Map();
    streamLockTimers = new Map();
    constructor(chatsRepository, messagesRepository, projectsRepository, dataSource, uploadsService, danaService, socketEventsService, logger, messages, configService) {
        this.chatsRepository = chatsRepository;
        this.messagesRepository = messagesRepository;
        this.projectsRepository = projectsRepository;
        this.dataSource = dataSource;
        this.uploadsService = uploadsService;
        this.danaService = danaService;
        this.socketEventsService = socketEventsService;
        this.logger = logger;
        this.messages = messages;
        this.configService = configService;
    }
    async create(type, username, projectId, conversationId) {
        try {
            return await this.chatsRepository.save(this.chatsRepository.create({
                type,
                username,
                projectId,
                historyId: type === chat_type_enum_1.ChatType.GENERAL ? conversationId : undefined,
                sessionId: type === chat_type_enum_1.ChatType.PROJECT ? conversationId : undefined,
            }));
        }
        catch {
            throw this.databaseError();
        }
    }
    async process(dto, username, files = []) {
        this.validateMessageLength(dto.messageSchema.message.message);
        const externalProjectId = dto.collectionId?.trim() || dto.projectId?.trim() || undefined;
        const historyId = dto.historyId?.trim() || (dto.retry ? dto.sessionId?.trim() : undefined) || this.createMessageId();
        this.logger.info(StreamService_1.name, 'Chat request processing started', {
            username,
            historyId,
            scope: externalProjectId ? 'project' : 'general',
            collectionId: externalProjectId,
            selectionMode: dto.selectionMode || 'generalChat',
            uploadedFileCount: files.length,
            referencedFileCount: dto.fileIds?.length ?? 0,
        });
        this.startUserStream(username, historyId);
        try {
            const projectId = await this.resolveProjectId(externalProjectId, username);
            if (dto.retry) {
                await this.uploadsService.discardTemporaryFiles(files);
                await this.retryUserMessage(dto, username, projectId);
                return;
            }
            const scope = projectId ? chat_type_enum_1.ChatType.PROJECT : chat_type_enum_1.ChatType.GENERAL;
            const message = dto.messageSchema.message;
            const uploadedFiles = await this.uploadsService.createForStream(files, username, historyId, projectId);
            const uploadedFileIds = uploadedFiles.map((file) => file.fileId);
            const fileIds = this.currentMessageFileIds(uploadedFileIds, message.attachments, dto.fileIds);
            let chat;
            try {
                chat = await this.chatsRepository.findOneBy(this.conversationWhere(username, historyId, projectId));
            }
            catch {
                throw this.databaseError();
            }
            const created = !chat;
            chat ??= await this.create(scope, username, projectId, historyId);
            this.logger.info(StreamService_1.name, created ? 'Conversation created' : 'Existing conversation selected', {
                username,
                historyId,
                chatId: chat.id,
                scope,
                collectionId: externalProjectId,
            });
            try {
                if (!projectId) {
                    await this.chatsRepository.update({ username, type: chat_type_enum_1.ChatType.GENERAL }, { isActive: false });
                }
                if (!chat.historyName) {
                    chat.historyName = await this.initialHistoryName(message.message, message.text ?? '', fileIds, uploadedFiles, username, projectId, historyId, dto.selectionMode);
                }
                chat.waiting = true;
                chat.answerStatus = answer_status_enum_1.AnswerStatus.PENDING;
                chat.state = 'done';
                chat.isActive = true;
                await this.chatsRepository.save(chat);
                if (created) {
                    this.socketEventsService.newHistory(username, {
                        historyId,
                        sessionId: historyId,
                        collectionId: externalProjectId ?? null,
                        historyName: chat.historyName,
                        historyType: projectId ? 'project' : 'general',
                        waiting: true,
                        answerStatus: answer_status_enum_1.AnswerStatus.PENDING,
                    });
                    if (this.usesDetectIntent(dto.selectionMode)) {
                        this.requestHistoryNameUpdate(chat.id, message.message, username, historyId, externalProjectId, projectId, chat.modelName);
                    }
                }
            }
            catch {
                throw this.databaseError();
            }
            const [, botMessage] = await this.sendMessage(chat.id, username, {
                messageId: message.id,
                unread: message.unread,
                type: message.type,
                message: message.message,
                text: message.text,
                letter_operation: this.requestedletter_operation(dto, message.letter_operation),
                translate: dto.translate,
                avatar: message.avatar,
                attachments: fileIds,
                liked: message.liked,
                disLiked: message.disLiked,
                starred: message.starred,
                delivered: message.delivered,
                comment: message.comment,
                reply: message.reply,
                createdAt: message.createdAt,
            }, projectId, historyId, dto.selectionMode);
            this.logger.info(StreamService_1.name, 'Chat request queued for AI processing', {
                username,
                historyId,
                chatId: chat.id,
                scope,
                fileCount: fileIds.length,
            });
            return { historyId, chatId: chat.id, messageId: botMessage.id, answerStatus: answer_status_enum_1.AnswerStatus.PENDING };
        }
        catch (error) {
            this.releaseStream(username, historyId);
            this.logger.failure(StreamService_1.name, 'Chat request processing failed', error, {
                username,
                historyId,
                scope: externalProjectId ? 'project' : 'general',
            });
            throw error;
        }
    }
    async remove(historyId, username, collectionId) {
        const projectId = await this.resolveProjectId(collectionId, username);
        let chat;
        try {
            chat = await this.chatsRepository.findOneBy(this.conversationWhere(username, historyId, projectId));
        }
        catch {
            throw this.databaseError();
        }
        if (!chat) {
            throw new common_1.NotFoundException(this.messages.translate('conversation.notFound'));
        }
        await this.uploadsService.removeByHistory(username, historyId, projectId);
        try {
            await this.chatsRepository.delete(chat.id);
        }
        catch {
            throw this.databaseError();
        }
        this.cancelActiveStream(username, historyId);
        this.socketEventsService.cancel(username, historyId);
    }
    async removeAllGeneralHistories(username) {
        let chats;
        try {
            chats = await this.chatsRepository.findBy({
                username,
                type: chat_type_enum_1.ChatType.GENERAL,
                projectId: (0, typeorm_2.IsNull)(),
            });
        }
        catch {
            throw this.databaseError();
        }
        const historyIds = chats.flatMap((chat) => (chat.historyId ? [chat.historyId] : []));
        for (const historyId of historyIds) {
            await this.uploadsService.removeByHistory(username, historyId);
        }
        try {
            await this.chatsRepository.delete({
                username,
                type: chat_type_enum_1.ChatType.GENERAL,
                projectId: (0, typeorm_2.IsNull)(),
            });
        }
        catch {
            throw this.databaseError();
        }
        historyIds.forEach((historyId) => {
            this.cancelActiveStream(username, historyId);
            this.socketEventsService.cancel(username, historyId);
        });
        return chats.length;
    }
    async editSession(dto, username) {
        const projectId = await this.resolveProjectId(dto.collectionId, username);
        let chat;
        try {
            chat = await this.chatsRepository.findOneBy(this.conversationWhere(username, dto.historyId, projectId));
        }
        catch {
            throw this.databaseError();
        }
        if (!chat) {
            throw new common_1.NotFoundException(this.messages.translate('conversation.notFound'));
        }
        chat.historyName = dto.data.historyName ?? chat.historyName;
        chat.translate = dto.data.translate ?? chat.translate;
        chat.reasoning = dto.data.reasoning ?? chat.reasoning;
        try {
            return await this.chatsRepository.save(chat);
        }
        catch {
            throw this.databaseError();
        }
    }
    async getHistories(username, projectId, pagination) {
        let chats;
        try {
            chats = await this.chatsRepository.find({
                where: {
                    username,
                    type: projectId ? chat_type_enum_1.ChatType.PROJECT : chat_type_enum_1.ChatType.GENERAL,
                    projectId: projectId ?? (0, typeorm_2.IsNull)(),
                },
                order: {
                    pinned: 'DESC',
                    updatedAt: 'DESC',
                    createdAt: 'DESC',
                },
                ...(pagination ? { take: pagination.limit, skip: pagination.offset } : {}),
            });
        }
        catch {
            throw this.databaseError();
        }
        return Promise.all(chats.map((chat) => this.toHistory(chat, username, projectId)));
    }
    async getGeneralHistoryFiles(username, historyId) {
        let chat;
        try {
            chat = await this.chatsRepository.findOneBy({
                username,
                historyId,
                type: chat_type_enum_1.ChatType.GENERAL,
                projectId: (0, typeorm_2.IsNull)(),
            });
        }
        catch {
            throw this.databaseError();
        }
        if (!chat) {
            throw new common_1.NotFoundException(this.messages.translate('conversation.generalNotFound'));
        }
        return this.uploadsService.findHistoryFiles(username, historyId);
    }
    async sendMessage(chatId, username, dto, projectId, historyId, selectionMode = selection_mode_enum_1.SelectionMode.GENERAL_CHAT) {
        const attachments = await this.uploadsService.findAttachments(dto.attachments, username, projectId, historyId);
        const [userMessage, botMessage] = await this.createMessagePair(chatId, username, dto, attachments.map(({ fileId, originalName, mimeType, size }) => ({
            fileId,
            originalName,
            mimeType,
            size,
        })), projectId, selectionMode);
        void this.processAiStream({
            username,
            prompt: dto.message,
            attachments,
            userMessage,
            text: dto.text ?? '',
            letter_operation: dto.letter_operation,
            translate: dto.translate,
            botMessage,
            scope: projectId ? stream_scope_enum_1.StreamScope.PROJECT : stream_scope_enum_1.StreamScope.GENERAL,
            historyId,
            selectionMode,
            projectId,
        });
        return [this.toResponse(userMessage), this.toResponse(botMessage)];
    }
    async getMessages(historyId, username, collectionId, pagination) {
        const projectId = await this.resolveProjectId(collectionId, username);
        let chat;
        try {
            chat = await this.chatsRepository.findOneBy({
                ...this.conversationWhere(username, historyId, projectId),
                type: projectId ? chat_type_enum_1.ChatType.PROJECT : chat_type_enum_1.ChatType.GENERAL,
            });
        }
        catch {
            throw this.databaseError();
        }
        if (!chat) {
            throw new common_1.NotFoundException(this.messages.translate('conversation.notFound'));
        }
        try {
            const messages = await this.messagesRepository.find({
                where: { chatId: chat.id },
                order: { sequence: 'ASC' },
                ...(pagination ? { take: pagination.limit, skip: pagination.offset } : {}),
            });
            return messages.map((message) => this.toResponse(message));
        }
        catch {
            throw this.databaseError();
        }
    }
    async updateUserMessage(dto, username, collectionId) {
        this.validateMessageLength(dto.message);
        if (this.activeStreams.has(username)) {
            throw new common_1.ConflictException(this.messages.translate('conversation.activeStream'));
        }
        const historyId = dto.historyId.trim();
        this.lockStream(username, historyId);
        try {
            const projectId = await this.resolveProjectId(collectionId, username);
            const { userMessage, botMessage, removedFileIds } = await this.replaceMessageAndAnswer(dto, username, projectId);
            await Promise.all(removedFileIds.map((fileId) => this.uploadsService.remove(fileId, username)));
            const attachmentIds = userMessage.attachments.map((attachment) => this.getAttachmentId(attachment)).filter((fileId) => Boolean(fileId));
            const attachments = await this.uploadsService.findAttachments(attachmentIds, username, projectId, historyId);
            void this.processAiStream({
                username,
                prompt: userMessage.message,
                attachments,
                userMessage,
                text: userMessage.text,
                botMessage,
                scope: projectId ? stream_scope_enum_1.StreamScope.PROJECT : stream_scope_enum_1.StreamScope.GENERAL,
                historyId,
                selectionMode: selection_mode_enum_1.SelectionMode.GENERAL_CHAT,
                projectId,
            });
        }
        catch (error) {
            this.releaseStream(username, historyId);
            throw error;
        }
    }
    async retryUserMessage(dto, username, projectId) {
        const historyId = dto.historyId?.trim() || dto.sessionId?.trim();
        const messageId = dto.messageSchema.message.id?.trim();
        if (!historyId || !messageId) {
            throw new common_1.BadRequestException(this.messages.translate('conversation.retryTargetRequired'));
        }
        const [userMessage, botMessage] = await this.createRetryAnswer(historyId, messageId, username, projectId, dto.selectionMode);
        const attachmentIds = userMessage.attachments.map((attachment) => this.getAttachmentId(attachment)).filter((fileId) => Boolean(fileId));
        const attachments = await this.uploadsService.findAttachments(attachmentIds, username, projectId, historyId);
        void this.processAiStream({
            username,
            prompt: userMessage.message,
            attachments,
            userMessage,
            text: userMessage.text,
            letter_operation: this.requestedletter_operation(dto, dto.messageSchema.message.letter_operation),
            translate: dto.translate,
            botMessage,
            scope: projectId ? stream_scope_enum_1.StreamScope.PROJECT : stream_scope_enum_1.StreamScope.GENERAL,
            historyId,
            selectionMode: dto.selectionMode,
            projectId,
        });
    }
    async createRetryAnswer(historyId, messageId, username, projectId, selectionMode) {
        try {
            return await this.dataSource.transaction(async (manager) => {
                const chat = await manager.getRepository(chat_entity_1.Chat).findOne({
                    where: {
                        username,
                        projectId: projectId ?? (0, typeorm_2.IsNull)(),
                        ...(projectId ? { sessionId: historyId } : { historyId }),
                    },
                    lock: { mode: 'pessimistic_write' },
                });
                if (!chat) {
                    throw new common_1.NotFoundException(this.messages.translate('conversation.notFound'));
                }
                const repository = manager.getRepository(chat_message_entity_1.ChatMessage);
                const userMessage = await repository.findOneBy({ id: messageId, chatId: chat.id, bot: false });
                if (!userMessage) {
                    throw new common_1.NotFoundException(this.messages.translate('conversation.userMessageNotFound'));
                }
                await repository.delete({ chatId: chat.id, sequence: (0, typeorm_2.MoreThan)(userMessage.sequence) });
                userMessage.selectionMode = selectionMode;
                userMessage.messageType = selectionMode;
                await repository.save(userMessage);
                const botMessage = repository.create({
                    id: this.createMessageId(),
                    chatId: chat.id,
                    sequence: userMessage.sequence + 1,
                    type: 'text',
                    selectionMode,
                    messageType: selectionMode,
                    message: '',
                    bot: true,
                    answerStatus: answer_status_enum_1.AnswerStatus.PENDING,
                });
                await repository.save(botMessage);
                await manager.getRepository(chat_entity_1.Chat).update(chat.id, {
                    waiting: true,
                    answerStatus: answer_status_enum_1.AnswerStatus.PENDING,
                    isActive: true,
                    state: 'done',
                    updatedAt: new Date(),
                });
                return [userMessage, botMessage];
            });
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw this.databaseError();
        }
    }
    async replaceMessageAndAnswer(dto, username, projectId) {
        try {
            return await this.dataSource.transaction(async (manager) => {
                const chat = await manager.getRepository(chat_entity_1.Chat).findOne({
                    where: {
                        username,
                        projectId: projectId ?? (0, typeorm_2.IsNull)(),
                        ...(projectId ? { sessionId: dto.historyId } : { historyId: dto.historyId }),
                    },
                    lock: { mode: 'pessimistic_write' },
                });
                if (!chat) {
                    throw new common_1.NotFoundException(this.messages.translate('conversation.notFound'));
                }
                const repository = manager.getRepository(chat_message_entity_1.ChatMessage);
                const userMessage = await repository.findOneBy({ id: dto.messageId, chatId: chat.id, bot: false });
                if (!userMessage) {
                    throw new common_1.NotFoundException(this.messages.translate('conversation.userMessageNotFound'));
                }
                const [previousMessages, followingMessages] = await Promise.all([
                    repository.find({ where: { chatId: chat.id, sequence: (0, typeorm_2.LessThan)(userMessage.sequence) } }),
                    repository.find({ where: { chatId: chat.id, sequence: (0, typeorm_2.MoreThan)(userMessage.sequence) } }),
                ]);
                const retainedFileIds = new Set([...previousMessages, userMessage]
                    .flatMap((message) => message.attachments.map((attachment) => this.getAttachmentId(attachment)))
                    .filter((fileId) => Boolean(fileId)));
                const removedFileIds = followingMessages
                    .flatMap((message) => message.attachments.map((attachment) => this.getAttachmentId(attachment)))
                    .filter((fileId) => Boolean(fileId))
                    .filter((fileId) => !retainedFileIds.has(fileId));
                await repository.delete({ chatId: chat.id, sequence: (0, typeorm_2.MoreThan)(userMessage.sequence) });
                userMessage.message = dto.message.trim();
                userMessage.type = 'text';
                userMessage.selectionMode = selection_mode_enum_1.SelectionMode.GENERAL_CHAT;
                userMessage.messageType = selection_mode_enum_1.SelectionMode.GENERAL_CHAT;
                userMessage.liked = false;
                userMessage.disLiked = false;
                const botMessage = repository.create({
                    id: this.createMessageId(),
                    chatId: chat.id,
                    sequence: userMessage.sequence + 1,
                    type: 'text',
                    selectionMode: selection_mode_enum_1.SelectionMode.GENERAL_CHAT,
                    messageType: selection_mode_enum_1.SelectionMode.GENERAL_CHAT,
                    message: '',
                    bot: true,
                    answerStatus: answer_status_enum_1.AnswerStatus.PENDING,
                });
                await repository.save(userMessage);
                await repository.save(botMessage);
                await manager.getRepository(chat_entity_1.Chat).update(chat.id, {
                    waiting: true,
                    answerStatus: answer_status_enum_1.AnswerStatus.PENDING,
                    state: 'done',
                    updatedAt: new Date(),
                });
                return {
                    userMessage,
                    botMessage,
                    removedFileIds: [...new Set(removedFileIds)],
                };
            });
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw this.databaseError();
        }
    }
    getAttachmentId(attachment) {
        if (typeof attachment === 'string') {
            return attachment;
        }
        if (attachment && typeof attachment === 'object' && 'fileId' in attachment) {
            const fileId = attachment.fileId;
            return typeof fileId === 'string' ? fileId : undefined;
        }
        return undefined;
    }
    async attachmentsForAi(currentAttachments, userMessage, username, projectId, historyId, selectionMode) {
        if (!this.usesDetectIntent(selectionMode)) {
            return currentAttachments;
        }
        let ragMessages;
        try {
            ragMessages = await this.messagesRepository.find({
                where: {
                    chatId: userMessage.chatId,
                    bot: false,
                    messageType: selection_mode_enum_1.SelectionMode.RAG,
                    sequence: (0, typeorm_2.LessThan)(userMessage.sequence),
                },
            });
        }
        catch {
            throw this.databaseError();
        }
        const ragAttachmentIds = ragMessages.flatMap((message) => message.attachments.map((attachment) => this.getAttachmentId(attachment)).filter((fileId) => Boolean(fileId)));
        const currentRagAttachmentIds = selectionMode === selection_mode_enum_1.SelectionMode.RAG ? currentAttachments.map((attachment) => attachment.fileId) : [];
        const fileIds = [...new Set([...ragAttachmentIds, ...currentRagAttachmentIds])];
        return fileIds.length ? this.uploadsService.findAttachments(fileIds, username, projectId, historyId) : [];
    }
    async createMessagePair(chatId, username, dto, attachments, projectId, selectionMode) {
        try {
            return await this.dataSource.transaction(async (manager) => {
                const chat = await manager.getRepository(chat_entity_1.Chat).findOne({
                    where: {
                        id: chatId,
                        username,
                        projectId: projectId ?? (0, typeorm_2.IsNull)(),
                    },
                    lock: { mode: 'pessimistic_write' },
                });
                if (!chat) {
                    throw new common_1.NotFoundException(this.messages.translate('conversation.notFound'));
                }
                const repository = manager.getRepository(chat_message_entity_1.ChatMessage);
                if (dto.messageId) {
                    const duplicateMessage = await repository.findOne({
                        where: { id: dto.messageId },
                    });
                    if (duplicateMessage) {
                        throw new common_1.ConflictException(this.messages.translate('conversation.duplicateMessage'));
                    }
                }
                const lastMessage = await repository.findOne({
                    where: { chatId },
                    order: { sequence: 'DESC' },
                });
                if (lastMessage?.bot === false) {
                    throw new common_1.ConflictException(this.messages.translate('conversation.consecutiveUserMessages'));
                }
                const sequence = lastMessage?.sequence ?? 0;
                const userMessage = repository.create({
                    id: dto.messageId ?? this.createMessageId(),
                    chatId,
                    sequence: sequence + 1,
                    unread: dto.unread ?? false,
                    type: dto.type ?? 'text',
                    selectionMode,
                    messageType: selectionMode,
                    message: dto.message.trim(),
                    text: dto.text ?? '',
                    bot: false,
                    avatar: dto.avatar ?? '',
                    attachments,
                    liked: dto.liked ?? false,
                    disLiked: dto.disLiked ?? false,
                    starred: dto.starred ?? false,
                    delivered: dto.delivered ?? false,
                    comment: dto.comment ?? '',
                    reply: dto.reply ?? [],
                    ...(dto.createdAt ? { createdAt: new Date(dto.createdAt) } : {}),
                    translate: [''],
                });
                const botMessage = repository.create({
                    id: this.createMessageId(),
                    chatId,
                    sequence: sequence + 2,
                    selectionMode,
                    messageType: selectionMode,
                    message: '',
                    bot: true,
                    answerStatus: answer_status_enum_1.AnswerStatus.PENDING,
                });
                await repository.save(userMessage);
                await repository.save(botMessage);
                await manager.getRepository(chat_entity_1.Chat).update(chat.id, {
                    updatedAt: new Date(),
                });
                this.logger.info(StreamService_1.name, 'Message pair stored', {
                    username,
                    chatId,
                    userMessageId: userMessage.id,
                    botMessageId: botMessage.id,
                });
                return [userMessage, botMessage];
            });
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ConflictException) {
                throw error;
            }
            throw this.databaseError();
        }
    }
    createMessageId() {
        return (0, node_crypto_1.randomInt)(10_000_000_000_000, 99_999_999_999_999).toString();
    }
    currentMessageFileIds(uploadedFileIds, messageFileIds = [], legacyFileIds = []) {
        const currentFileIds = uploadedFileIds.length ? uploadedFileIds : messageFileIds.length ? messageFileIds : legacyFileIds;
        return [...new Set(currentFileIds)];
    }
    requestedletter_operation(dto, fallback) {
        const value = dto['letter_operation'];
        return typeof value === 'string' ? value : fallback;
    }
    async initialHistoryName(message, text, fileIds, uploadedFiles, username, projectId, historyId, selectionMode) {
        if (this.usesDetectIntent(selectionMode)) {
            return message.slice(0, 100);
        }
        const files = uploadedFiles.length ? uploadedFiles : await this.uploadsService.findAttachments(fileIds, username, projectId, historyId);
        const fileById = new Map(files.map((file) => [file.fileId, file]));
        const filename = fileIds.map((fileId) => fileById.get(fileId)?.filename).find(Boolean);
        return `${selection_mode_history_title_constant_1.SELECTION_MODE_HISTORY_TITLE[selectionMode]} فایل ${filename ?? text}`;
    }
    usesDetectIntent(selectionMode) {
        return selectionMode === selection_mode_enum_1.SelectionMode.RAG || selectionMode === selection_mode_enum_1.SelectionMode.GENERAL_CHAT;
    }
    async processAiStream({ username, prompt, attachments, userMessage, text, letter_operation, translate, botMessage, scope, historyId, selectionMode, projectId, }) {
        const payload = {
            chatId: historyId ?? botMessage.chatId,
            historyId: historyId ?? botMessage.chatId,
            messageId: botMessage.id,
            scope,
        };
        let streamedMessage = '';
        let socketAttachments = attachments;
        let socketPayload = {
            ...payload,
            attachments: this.toMessageAttachments(socketAttachments),
        };
        let aiResponded = false;
        let aiTimedOut = false;
        let streamingStatusUpdate;
        const abortController = new AbortController();
        this.activeStreamControllers.set(username, {
            historyId: payload.historyId,
            controller: abortController,
        });
        let responseTimeout;
        const markAiResponse = () => {
            if (aiResponded)
                return;
            aiResponded = true;
            clearTimeout(responseTimeout);
            this.clearStreamLockTimer(username, payload.historyId);
        };
        const emitChunk = (token) => {
            if (aiTimedOut || abortController.signal.aborted)
                return;
            markAiResponse();
            if (!streamingStatusUpdate) {
                streamingStatusUpdate = this.updateAnswerStatus(botMessage, answer_status_enum_1.AnswerStatus.STREAMING);
            }
            streamedMessage += token;
            this.socketEventsService.token(username, {
                ...socketPayload,
                token,
                message: streamedMessage,
                messages: this.toStreamMessages(userMessage, botMessage, stream_message_type_enum_1.StreamMessageType.TEXT, streamedMessage, socketAttachments),
            });
        };
        try {
            const [previousMessages, chat, files] = await Promise.all([
                this.messagesRepository.find({
                    where: {
                        chatId: userMessage.chatId,
                        sequence: (0, typeorm_2.LessThan)(userMessage.sequence),
                    },
                    order: { sequence: 'ASC' },
                }),
                this.chatsRepository.findOneBy({ id: userMessage.chatId }),
                this.attachmentsForAi(attachments, userMessage, username, projectId, historyId, selectionMode),
            ]);
            socketAttachments = files;
            if (this.usesDetectIntent(selectionMode)) {
                userMessage.attachments = this.toMessageAttachments(files);
                await this.messagesRepository.save(userMessage);
            }
            socketPayload = {
                ...payload,
                attachments: this.toMessageAttachments(socketAttachments),
            };
            this.socketEventsService.start(username, {
                ...socketPayload,
                messages: this.toStreamMessages(userMessage, botMessage, selectionMode, '', socketAttachments),
            });
            const history = previousMessages.length < 2
                ? Array.from({ length: 2 }, () => ({
                    ...this.toSocketResponse(botMessage),
                    id: this.createMessageId(),
                    message: '',
                }))
                : previousMessages.slice(-12).map((message) => this.toSocketResponse(message));
            let generatedFile;
            const responseTimeoutMs = this.streamLockTimeoutMs();
            const aiRequest = this.danaService.stream({
                userQuery: prompt,
                username,
                history,
                historyCount: this.historyCount(),
                text,
                letter_operation,
                translate,
                selectionMode,
                files,
            }, (token) => emitChunk(token), chat?.modelName, async (file) => {
                if (aiTimedOut || abortController.signal.aborted)
                    return;
                markAiResponse();
                const upload = await this.uploadsService.registerGeneratedAiFile(username, file.objectKey, file.bucket, historyId ?? botMessage.chatId, projectId);
                if (abortController.signal.aborted)
                    return;
                botMessage.attachments = [{ fileId: upload.fileId }];
                generatedFile = {
                    fileId: upload.fileId,
                    filename: upload.filename,
                    downloadUrl: `/chat/api/uploads/${upload.fileId}/download`,
                };
            }, abortController.signal);
            let timeout;
            if (responseTimeoutMs !== undefined) {
                timeout = new Promise((_resolve, reject) => {
                    responseTimeout = setTimeout(() => {
                        if (aiResponded)
                            return;
                        aiTimedOut = true;
                        abortController.abort();
                        reject(new Error('AI stream response timed out'));
                    }, responseTimeoutMs);
                    responseTimeout.unref?.();
                });
            }
            const answer = await Promise.race(timeout ? [aiRequest, timeout] : [aiRequest]);
            if (abortController.signal.aborted && !aiTimedOut)
                return;
            if (!answer.trim() && !generatedFile) {
                throw new Error('AI service returned an empty answer');
            }
            await streamingStatusUpdate;
            botMessage.message = answer;
            botMessage.text = text;
            botMessage.answerStatus = answer_status_enum_1.AnswerStatus.COMPLETED;
            await this.messagesRepository.save(botMessage);
            await this.chatsRepository.update(botMessage.chatId, {
                waiting: false,
                isActive: false,
                state: 'done',
                answerStatus: answer_status_enum_1.AnswerStatus.COMPLETED,
            });
            await this.emitNewHistory(username, projectId);
            this.socketEventsService.end(username, {
                ...socketPayload,
                type: stream_message_type_enum_1.StreamMessageType.DONE,
                message: answer,
                ...(generatedFile ? { file: generatedFile } : {}),
                messages: this.toStreamMessages(userMessage, botMessage, stream_message_type_enum_1.StreamMessageType.DONE, answer, socketAttachments),
            });
        }
        catch (error) {
            if (abortController.signal.aborted && !aiTimedOut)
                return;
            await streamingStatusUpdate?.catch(() => undefined);
            const aiErrorMessage = aiTimedOut
                ? this.messages.translate('conversation.aiTimeout')
                : (0, external_http_exception_1.isServiceUnavailableError)(error)
                    ? this.messages.translate('conversation.aiUnavailable')
                    : ((0, external_http_exception_1.httpExceptionMessage)(error) ?? this.messages.translate('conversation.aiFailed'));
            botMessage.message = aiErrorMessage;
            botMessage.answerStatus = answer_status_enum_1.AnswerStatus.FAILED;
            await this.messagesRepository.save(botMessage).catch(() => undefined);
            await this.chatsRepository
                .update(botMessage.chatId, {
                waiting: false,
                isActive: false,
                state: 'failure',
                answerStatus: answer_status_enum_1.AnswerStatus.FAILED,
            })
                .catch(() => undefined);
            await this.emitNewHistory(username, projectId);
            this.socketEventsService.error(username, {
                ...socketPayload,
                type: stream_message_type_enum_1.StreamMessageType.FAILURE,
                message: aiErrorMessage,
                messages: this.toStreamMessages(userMessage, botMessage, stream_message_type_enum_1.StreamMessageType.FAILURE, aiErrorMessage, socketAttachments),
            });
            this.socketEventsService.token(username, {
                ...socketPayload,
                type: stream_message_type_enum_1.StreamMessageType.FAILURE,
                token: aiErrorMessage,
                message: aiErrorMessage,
                messages: this.toStreamMessages(userMessage, botMessage, stream_message_type_enum_1.StreamMessageType.FAILURE, aiErrorMessage, socketAttachments),
            });
            this.socketEventsService.end(username, {
                ...socketPayload,
                type: stream_message_type_enum_1.StreamMessageType.FAILURE,
                message: aiErrorMessage,
                messages: this.toStreamMessages(userMessage, botMessage, stream_message_type_enum_1.StreamMessageType.FAILURE, aiErrorMessage, socketAttachments),
            });
            this.logger.failure(StreamService_1.name, 'AI stream processing failed', error, {
                username,
                historyId,
                chatId: botMessage.chatId,
                messageId: botMessage.id,
            });
        }
        finally {
            if (responseTimeout)
                clearTimeout(responseTimeout);
            const activeController = this.activeStreamControllers.get(username);
            if (activeController?.controller === abortController) {
                this.activeStreamControllers.delete(username);
            }
            this.releaseStream(username, payload.historyId);
        }
    }
    cancelActiveStream(username, historyId) {
        const activeController = this.activeStreamControllers.get(username);
        if (activeController?.historyId === historyId) {
            activeController.controller.abort();
            this.activeStreamControllers.delete(username);
        }
        this.releaseStream(username, historyId);
    }
    releaseStream(username, historyId) {
        if (this.activeStreams.get(username) !== historyId)
            return;
        this.activeStreams.delete(username);
        const timer = this.streamLockTimers.get(username);
        if (timer)
            clearTimeout(timer);
        this.streamLockTimers.delete(username);
    }
    clearStreamLockTimer(username, historyId) {
        if (this.activeStreams.get(username) !== historyId)
            return;
        const timer = this.streamLockTimers.get(username);
        if (timer)
            clearTimeout(timer);
        this.streamLockTimers.delete(username);
    }
    lockStream(username, historyId) {
        this.activeStreams.set(username, historyId);
        const timeoutMs = this.streamLockTimeoutMs();
        if (timeoutMs === undefined)
            return;
        const timer = setTimeout(() => this.expireStreamLock(username, historyId), timeoutMs);
        timer.unref?.();
        this.streamLockTimers.set(username, timer);
    }
    expireStreamLock(username, historyId) {
        if (this.activeStreams.get(username) !== historyId)
            return;
        this.activeStreams.delete(username);
        this.streamLockTimers.delete(username);
        this.logger.warning(StreamService_1.name, 'Chat stream lock expired', { username, historyId });
    }
    streamLockTimeoutMs() {
        const seconds = Number(this.configService.get('STREAM_LOCK_TIMEOUT_SECONDS', '0'));
        return Number.isFinite(seconds) && seconds > 0 ? seconds * 1_000 : undefined;
    }
    historyCount() {
        const value = Number(this.configService.get('HISTORY_COUNT', '1'));
        return Number.isInteger(value) && value >= 0 ? value : 1;
    }
    requestHistoryNameUpdate(chatId, userQuery, username, historyId, collectionId, projectId, modelName) {
        setImmediate(() => void this.updateHistoryName(chatId, userQuery, username, historyId, collectionId, projectId, modelName));
    }
    async updateHistoryName(chatId, userQuery, username, historyId, collectionId, projectId, modelName) {
        try {
            const modelConfigs = await this.danaService.createModelConfigs(username, modelName);
            const historyName = await this.danaService.detectIntent({
                UserInfo: {
                    userQuery: userQuery || 'default',
                    username,
                    history: [],
                    historyCount: this.historyCount(),
                },
                ModelConfigs: modelConfigs,
            });
            await this.chatsRepository.update({ id: chatId, username }, { historyName });
            const chat = await this.chatsRepository.findOneBy({ id: chatId, username });
            this.socketEventsService.newHistory(username, {
                historyId,
                sessionId: historyId,
                collectionId: collectionId ?? null,
                historyName,
                historyType: projectId ? 'project' : 'general',
                waiting: chat?.waiting ?? true,
                answerStatus: chat?.answerStatus ?? answer_status_enum_1.AnswerStatus.PENDING,
            });
        }
        catch (error) {
            this.logger.failure(StreamService_1.name, 'Could not update conversation history name', error, {
                username,
                chatId,
            });
        }
    }
    async emitNewHistory(username, projectId) {
        try {
            this.socketEventsService.newHistory(username, await this.getHistories(username, projectId));
        }
        catch (error) {
            this.logger.failure(StreamService_1.name, 'Could not emit updated conversation history', error, {
                username,
                scope: projectId ? 'project' : 'general',
            });
        }
    }
    async updateAnswerStatus(botMessage, answerStatus) {
        botMessage.answerStatus = answerStatus;
        await Promise.all([this.messagesRepository.update({ id: botMessage.id }, { answerStatus }), this.chatsRepository.update(botMessage.chatId, { answerStatus })]);
    }
    toStreamMessages(userMessage, botMessage, botType, botText = '', attachments = []) {
        const isFinished = botType === stream_message_type_enum_1.StreamMessageType.DONE || botType === stream_message_type_enum_1.StreamMessageType.FAILURE;
        return [userMessage, botMessage].map((message) => {
            if (message.id === userMessage.id) {
                return {
                    ...this.toSocketResponse(message),
                    type: isFinished ? stream_message_type_enum_1.StreamMessageType.TEXT : botType,
                    attachments: this.toMessageAttachments(attachments),
                };
            }
            if (message.id === botMessage.id) {
                return { ...this.toSocketResponse(message), type: botType, message: botText };
            }
            return this.toSocketResponse(message);
        });
    }
    toMessageAttachments(attachments) {
        return attachments.map(({ fileId, originalName, mimeType, size }) => ({
            fileId,
            originalName,
            mimeType,
            size,
        }));
    }
    toResponse(message) {
        return {
            id: message.id,
            unread: message.unread,
            type: message.type,
            selectionMode: message.selectionMode,
            messageType: message.messageType,
            message: message.message,
            bot: message.bot,
            answerStatus: message.answerStatus,
            avatar: message.avatar,
            attachments: message.attachments,
            liked: message.liked,
            disLiked: message.disLiked,
            starred: message.starred,
            delivered: message.delivered,
            createdAt: { $date: message.createdAt.toISOString() },
            comment: message.comment,
            translate: message.translate,
            reply: message.reply,
        };
    }
    async toHistory(chat, username, projectId) {
        let messages;
        try {
            messages = await this.messagesRepository.find({
                where: { chatId: chat.id },
                order: { sequence: 'ASC' },
            });
        }
        catch {
            throw this.databaseError();
        }
        const conversationId = projectId ? chat.sessionId : chat.historyId;
        const files = conversationId ? await this.uploadsService.findHistoryFiles(username, conversationId, projectId) : [];
        const firstUserMessage = messages.find((message) => !message.bot);
        return {
            user_name: username,
            historyId: conversationId ?? chat.id,
            ...(projectId ? { sessionId: chat.sessionId ?? chat.id } : {}),
            historyCount: messages.filter((message) => !message.bot).length,
            historyName: chat.historyName || firstUserMessage?.message.slice(0, 100) || '',
            historyType: projectId ? 'project' : 'general',
            isActive: chat.isActive,
            pinned: chat.pinned,
            modelName: chat.modelName,
            prompt: '',
            reasoning: chat.reasoning,
            state: chat.state,
            translate: chat.translate.length ? chat.translate : [''],
            waiting: chat.waiting,
            answerStatus: chat.answerStatus,
            files: files.map((file) => file.fileId),
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
        };
    }
    toSocketResponse(message) {
        return {
            id: message.id,
            unread: message.unread,
            type: message.type,
            selectionMode: message.selectionMode,
            messageType: message.messageType,
            message: message.message,
            text: message.text,
            bot: message.bot,
            answerStatus: message.answerStatus,
            avatar: message.avatar,
            translate: message.translate,
            reasoning: message.bot ? '' : false,
            attachments: message.attachments,
            liked: message.liked,
            disLiked: message.disLiked,
            starred: message.starred,
            comment: message.comment,
            createdAt: message.createdAt.toISOString(),
        };
    }
    databaseError() {
        return new common_1.ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
    }
    validateMessageLength(message) {
        if ((message?.length ?? 0) > this.configService.get('MESSAGE_LENGTH', 260)) {
            throw this.toLongMessage();
        }
    }
    startUserStream(username, historyId) {
        if (this.activeStreams.has(username)) {
            this.logger.warning(StreamService_1.name, 'Chat request rejected because another stream is active', {
                username,
                historyId,
                activeHistoryId: this.activeStreams.get(username),
            });
            throw new common_1.ConflictException(this.messages.translate('conversation.activeStream'));
        }
        this.lockStream(username, historyId);
    }
    conversationWhere(username, historyId, projectId) {
        return {
            username,
            projectId: projectId ?? (0, typeorm_2.IsNull)(),
            ...(projectId ? { sessionId: historyId } : { historyId }),
        };
    }
    toLongMessage() {
        return new common_1.BadRequestException(this.messages.translate('common.toLongMessage'));
    }
    async resolveProjectId(collectionId, username) {
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
            throw this.databaseError();
        }
        if (!project) {
            throw new common_1.NotFoundException(this.messages.translate('project.notFound'));
        }
        return project.id;
    }
};
exports.StreamService = StreamService;
exports.StreamService = StreamService = StreamService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(chat_entity_1.Chat)),
    __param(1, (0, typeorm_1.InjectRepository)(chat_message_entity_1.ChatMessage)),
    __param(2, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        uploads_service_1.UploadsService,
        dana_service_1.DanaService,
        socket_events_service_1.SocketEventsService,
        log_manager_service_1.LogManager,
        i18n_message_service_1.I18nMessageService,
        config_1.ConfigService])
], StreamService);
//# sourceMappingURL=stream.service.js.map
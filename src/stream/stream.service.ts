import { BadRequestException, ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'node:crypto';
import { DataSource, IsNull, LessThan, MoreThan, Repository } from 'typeorm';
import type { FindOptionsWhere } from 'typeorm';
import { LogManager } from '../common/logger/log-manager.service';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { httpExceptionMessage, isServiceUnavailableError } from '../common/http/external-http-exception';
import type { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { DanaService } from '../dana/dana.service';
import { Project } from '../projects/entities/project.entity';
import type { Upload } from '../uploads/entities/upload.entity';
import { UploadsService } from '../uploads/uploads.service';
import type { SendMessageDto } from './dto/send-message.dto';
import type { StreamMessageDto } from './dto/stream-message.dto';
import type { EditSessionDto } from './dto/edit-session.dto';
import type { UpdateUserMessageDto } from './dto/update-user-message.dto';
import { SELECTION_MODE_HISTORY_TITLE } from './constants/selection-mode-history-title.constant';
import { ChatMessage } from './entities/chat-message.entity';
import { Chat } from './entities/chat.entity';
import { ChatType } from './enums/chat-type.enum';
import { StreamMessageType } from './enums/stream-message-type.enum';
import { AnswerStatus } from './enums/answer-status.enum';
import { StreamScope } from './enums/stream-scope.enum';
import { SelectionMode } from './enums/selection-mode.enum';
import type { ActiveStreamController } from './interfaces/active-stream-controller.interface';
import type { AiStreamContext } from './interfaces/ai-stream-context.interface';
import type { MessagePair } from './interfaces/message-pair.type';
import type { UpdatedMessagePair } from './interfaces/updated-message-pair.interface';
import { SocketEventsService } from '../socket/services/socket-events.service';

@Injectable()
export class StreamService {
  private readonly activeStreams = new Map<string, string>();
  private readonly activeStreamControllers = new Map<string, ActiveStreamController>();
  private readonly streamLockTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    @InjectRepository(Chat)
    private readonly chatsRepository: Repository<Chat>,
    @InjectRepository(ChatMessage)
    private readonly messagesRepository: Repository<ChatMessage>,
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    private readonly dataSource: DataSource,
    private readonly uploadsService: UploadsService,
    private readonly danaService: DanaService,
    private readonly socketEventsService: SocketEventsService,
    private readonly logger: LogManager,
    private readonly messages: I18nMessageService,
    private readonly configService: ConfigService
  ) {}

  async create(type: ChatType, username: string, projectId?: string, conversationId?: string): Promise<Chat> {
    try {
      return await this.chatsRepository.save(
        this.chatsRepository.create({
          type,
          username,
          projectId,
          historyId: type === ChatType.GENERAL ? conversationId : undefined,
          sessionId: type === ChatType.PROJECT ? conversationId : undefined,
        })
      );
    } catch {
      throw this.databaseError();
    }
  }

  async process(
    dto: StreamMessageDto,
    username: string,
    files: Express.Multer.File[] = []
  ): Promise<{ historyId: string; chatId: string; messageId: string; answerStatus: AnswerStatus } | undefined> {
    this.validateMessageLength(dto.messageSchema.message.message);

    const externalProjectId = dto.collectionId?.trim() || dto.projectId?.trim() || undefined;
    const historyId = dto.historyId?.trim() || (dto.retry ? dto.sessionId?.trim() : undefined) || this.createMessageId();
    this.logger.info(StreamService.name, 'Chat request processing started', {
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
      const scope = projectId ? ChatType.PROJECT : ChatType.GENERAL;
      const message = dto.messageSchema.message;
      const uploadedFiles = await this.uploadsService.createForStream(files, username, historyId, projectId);
      const uploadedFileIds = uploadedFiles.map((file) => file.fileId);
      const fileIds = this.currentMessageFileIds(uploadedFileIds, message.attachments, dto.fileIds);

      let chat: Chat | null;
      try {
        chat = await this.chatsRepository.findOneBy(this.conversationWhere(username, historyId, projectId));
      } catch {
        throw this.databaseError();
      }

      const created = !chat;
      chat ??= await this.create(scope, username, projectId, historyId);
      this.logger.info(StreamService.name, created ? 'Conversation created' : 'Existing conversation selected', {
        username,
        historyId,
        chatId: chat.id,
        scope,
        collectionId: externalProjectId,
      });
      try {
        if (!projectId) {
          await this.chatsRepository.update({ username, type: ChatType.GENERAL }, { isActive: false });
        }
        if (!chat.historyName) {
          chat.historyName = await this.initialHistoryName(message.message, message.text ?? '', fileIds, uploadedFiles, username, projectId, historyId, dto.selectionMode);
        }
        chat.waiting = true;
        chat.answerStatus = AnswerStatus.PENDING;
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
            answerStatus: AnswerStatus.PENDING,
          });
          if (this.usesDetectIntent(dto.selectionMode)) {
            this.requestHistoryNameUpdate(chat.id, message.message, username, historyId, externalProjectId, projectId, chat.modelName);
          }
        }
      } catch {
        throw this.databaseError();
      }

      const [, botMessage] = await this.sendMessage(
        chat.id,
        username,
        {
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
        },
        projectId,
        historyId,
        dto.selectionMode
      );
      this.logger.info(StreamService.name, 'Chat request queued for AI processing', {
        username,
        historyId,
        chatId: chat.id,
        scope,
        fileCount: fileIds.length,
      });
      // The HTTP request only acknowledges that the AI response has been queued.
      // Streaming may start before this response is serialized, so never expose a
      // later state here; socket events and subsequent API reads carry transitions.
      return { historyId, chatId: chat.id, messageId: botMessage!.id, answerStatus: AnswerStatus.PENDING };
    } catch (error) {
      this.releaseStream(username, historyId);
      this.logger.failure(StreamService.name, 'Chat request processing failed', error, {
        username,
        historyId,
        scope: externalProjectId ? 'project' : 'general',
      });
      throw error;
    }
  }

  async remove(historyId: string, username: string, collectionId?: string): Promise<void> {
    const projectId = await this.resolveProjectId(collectionId, username);
    let chat: Chat | null;
    try {
      chat = await this.chatsRepository.findOneBy(this.conversationWhere(username, historyId, projectId));
    } catch {
      throw this.databaseError();
    }

    if (!chat) {
      throw new NotFoundException(this.messages.translate('conversation.notFound'));
    }

    await this.uploadsService.removeByHistory(username, historyId, projectId);

    try {
      await this.chatsRepository.delete(chat.id);
    } catch {
      throw this.databaseError();
    }
    this.cancelActiveStream(username, historyId);
    this.socketEventsService.cancel(username, historyId);
  }

  async removeAllGeneralHistories(username: string): Promise<number> {
    let chats: Chat[];
    try {
      chats = await this.chatsRepository.findBy({
        username,
        type: ChatType.GENERAL,
        projectId: IsNull(),
      });
    } catch {
      throw this.databaseError();
    }

    const historyIds = chats.flatMap((chat) => (chat.historyId ? [chat.historyId] : []));
    for (const historyId of historyIds) {
      await this.uploadsService.removeByHistory(username, historyId);
    }

    try {
      await this.chatsRepository.delete({
        username,
        type: ChatType.GENERAL,
        projectId: IsNull(),
      });
    } catch {
      throw this.databaseError();
    }
    historyIds.forEach((historyId) => {
      this.cancelActiveStream(username, historyId);
      this.socketEventsService.cancel(username, historyId);
    });
    return chats.length;
  }

  async editSession(dto: EditSessionDto, username: string): Promise<Chat> {
    const projectId = await this.resolveProjectId(dto.collectionId, username);
    let chat: Chat | null;
    try {
      chat = await this.chatsRepository.findOneBy(this.conversationWhere(username, dto.historyId, projectId));
    } catch {
      throw this.databaseError();
    }

    if (!chat) {
      throw new NotFoundException(this.messages.translate('conversation.notFound'));
    }

    chat.historyName = dto.data.historyName ?? chat.historyName;
    chat.translate = dto.data.translate ?? chat.translate;
    chat.reasoning = dto.data.reasoning ?? chat.reasoning;
    try {
      return await this.chatsRepository.save(chat);
    } catch {
      throw this.databaseError();
    }
  }

  async getHistories(username: string, projectId?: string, pagination?: PaginationQueryDto) {
    let chats: Chat[];
    try {
      chats = await this.chatsRepository.find({
        where: {
          username,
          type: projectId ? ChatType.PROJECT : ChatType.GENERAL,
          projectId: projectId ?? IsNull(),
        },
        order: {
          pinned: 'DESC',
          updatedAt: 'DESC',
          createdAt: 'DESC',
        },
        ...(pagination ? { take: pagination.limit, skip: pagination.offset } : {}),
      });
    } catch {
      throw this.databaseError();
    }

    return Promise.all(chats.map((chat) => this.toHistory(chat, username, projectId)));
  }

  async getGeneralHistoryFiles(username: string, historyId: string) {
    let chat: Chat | null;
    try {
      chat = await this.chatsRepository.findOneBy({
        username,
        historyId,
        type: ChatType.GENERAL,
        projectId: IsNull(),
      });
    } catch {
      throw this.databaseError();
    }

    if (!chat) {
      throw new NotFoundException(this.messages.translate('conversation.generalNotFound'));
    }

    return this.uploadsService.findHistoryFiles(username, historyId);
  }

  async sendMessage(chatId: string, username: string, dto: SendMessageDto, projectId?: string, historyId?: string, selectionMode: SelectionMode = SelectionMode.GENERAL_CHAT) {
    const attachments = await this.uploadsService.findAttachments(dto.attachments, username, projectId, historyId);
    const [userMessage, botMessage] = await this.createMessagePair(
      chatId,
      username,
      dto,
      attachments.map(({ fileId, originalName, mimeType, size }) => ({
        fileId,
        originalName,
        mimeType,
        size,
      })),
      projectId,
      selectionMode
    );

    void this.processAiStream({
      username,
      prompt: dto.message,
      attachments,
      userMessage,
      text: dto.text ?? '',
      letter_operation: dto.letter_operation,
      translate: dto.translate,
      botMessage,
      scope: projectId ? StreamScope.PROJECT : StreamScope.GENERAL,
      historyId,
      selectionMode,
      projectId,
    });

    return [this.toResponse(userMessage), this.toResponse(botMessage)];
  }

  async getMessages(historyId: string, username: string, collectionId?: string, pagination?: PaginationQueryDto) {
    const projectId = await this.resolveProjectId(collectionId, username);
    let chat: Chat | null;
    try {
      chat = await this.chatsRepository.findOneBy({
        ...this.conversationWhere(username, historyId, projectId),
        type: projectId ? ChatType.PROJECT : ChatType.GENERAL,
      });
    } catch {
      throw this.databaseError();
    }

    if (!chat) {
      throw new NotFoundException(this.messages.translate('conversation.notFound'));
    }

    try {
      const messages = await this.messagesRepository.find({
        where: { chatId: chat.id },
        order: { sequence: 'ASC' },
        ...(pagination ? { take: pagination.limit, skip: pagination.offset } : {}),
      });
      return messages.map((message) => this.toResponse(message));
    } catch {
      throw this.databaseError();
    }
  }

  async updateUserMessage(dto: UpdateUserMessageDto, username: string, collectionId?: string): Promise<void> {
    this.validateMessageLength(dto.message);
    if (this.activeStreams.has(username)) {
      throw new ConflictException(this.messages.translate('conversation.activeStream'));
    }

    const historyId = dto.historyId.trim();
    this.lockStream(username, historyId);
    try {
      const projectId = await this.resolveProjectId(collectionId, username);
      const { userMessage, botMessage, removedFileIds } = await this.replaceMessageAndAnswer(dto, username, projectId);
      await Promise.all(removedFileIds.map((fileId) => this.uploadsService.remove(fileId, username)));
      const attachmentIds = userMessage.attachments.map((attachment) => this.getAttachmentId(attachment)).filter((fileId): fileId is string => Boolean(fileId));
      const attachments = await this.uploadsService.findAttachments(attachmentIds, username, projectId, historyId);
      void this.processAiStream({
        username,
        prompt: userMessage.message,
        attachments,
        userMessage,
        text: userMessage.text,
        botMessage,
        scope: projectId ? StreamScope.PROJECT : StreamScope.GENERAL,
        historyId,
        selectionMode: SelectionMode.GENERAL_CHAT,
        projectId,
      });
    } catch (error) {
      this.releaseStream(username, historyId);
      throw error;
    }
  }

  private async retryUserMessage(dto: StreamMessageDto, username: string, projectId?: string): Promise<void> {
    const historyId = dto.historyId?.trim() || dto.sessionId?.trim();
    const messageId = dto.messageSchema.message.id?.trim();
    if (!historyId || !messageId) {
      throw new BadRequestException(this.messages.translate('conversation.retryTargetRequired'));
    }

    const [userMessage, botMessage] = await this.createRetryAnswer(historyId, messageId, username, projectId, dto.selectionMode);
    const attachmentIds = userMessage.attachments.map((attachment) => this.getAttachmentId(attachment)).filter((fileId): fileId is string => Boolean(fileId));
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
      scope: projectId ? StreamScope.PROJECT : StreamScope.GENERAL,
      historyId,
      selectionMode: dto.selectionMode,
      projectId,
    });
  }

  private async createRetryAnswer(historyId: string, messageId: string, username: string, projectId: string | undefined, selectionMode: SelectionMode): Promise<MessagePair> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const chat = await manager.getRepository(Chat).findOne({
          where: {
            username,
            projectId: projectId ?? IsNull(),
            ...(projectId ? { sessionId: historyId } : { historyId }),
          },
          lock: { mode: 'pessimistic_write' },
        });
        if (!chat) {
          throw new NotFoundException(this.messages.translate('conversation.notFound'));
        }

        const repository = manager.getRepository(ChatMessage);
        const userMessage = await repository.findOneBy({ id: messageId, chatId: chat.id, bot: false });
        if (!userMessage) {
          throw new NotFoundException(this.messages.translate('conversation.userMessageNotFound'));
        }
        await repository.delete({ chatId: chat.id, sequence: MoreThan(userMessage.sequence) });
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
          answerStatus: AnswerStatus.PENDING,
        });
        await repository.save(botMessage);
        await manager.getRepository(Chat).update(chat.id, {
          waiting: true,
          answerStatus: AnswerStatus.PENDING,
          isActive: true,
          state: 'done',
          updatedAt: new Date(),
        });
        return [userMessage, botMessage];
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw this.databaseError();
    }
  }

  private async replaceMessageAndAnswer(dto: UpdateUserMessageDto, username: string, projectId?: string): Promise<UpdatedMessagePair> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const chat = await manager.getRepository(Chat).findOne({
          where: {
            username,
            projectId: projectId ?? IsNull(),
            ...(projectId ? { sessionId: dto.historyId } : { historyId: dto.historyId }),
          },
          lock: { mode: 'pessimistic_write' },
        });
        if (!chat) {
          throw new NotFoundException(this.messages.translate('conversation.notFound'));
        }

        const repository = manager.getRepository(ChatMessage);
        const userMessage = await repository.findOneBy({ id: dto.messageId, chatId: chat.id, bot: false });
        if (!userMessage) {
          throw new NotFoundException(this.messages.translate('conversation.userMessageNotFound'));
        }

        const [previousMessages, followingMessages] = await Promise.all([
          repository.find({ where: { chatId: chat.id, sequence: LessThan(userMessage.sequence) } }),
          repository.find({ where: { chatId: chat.id, sequence: MoreThan(userMessage.sequence) } }),
        ]);
        const retainedFileIds = new Set(
          [...previousMessages, userMessage]
            .flatMap((message) => message.attachments.map((attachment) => this.getAttachmentId(attachment)))
            .filter((fileId): fileId is string => Boolean(fileId))
        );
        const removedFileIds = followingMessages
          .flatMap((message) => message.attachments.map((attachment) => this.getAttachmentId(attachment)))
          .filter((fileId): fileId is string => Boolean(fileId))
          .filter((fileId) => !retainedFileIds.has(fileId));

        await repository.delete({ chatId: chat.id, sequence: MoreThan(userMessage.sequence) });
        userMessage.message = dto.message.trim();
        userMessage.type = 'text';
        userMessage.selectionMode = SelectionMode.GENERAL_CHAT;
        userMessage.messageType = SelectionMode.GENERAL_CHAT;
        userMessage.liked = false;
        userMessage.disLiked = false;
        const botMessage = repository.create({
          id: this.createMessageId(),
          chatId: chat.id,
          sequence: userMessage.sequence + 1,
          type: 'text',
          selectionMode: SelectionMode.GENERAL_CHAT,
          messageType: SelectionMode.GENERAL_CHAT,
          message: '',
          bot: true,
          answerStatus: AnswerStatus.PENDING,
        });
        await repository.save(userMessage);
        await repository.save(botMessage);
        await manager.getRepository(Chat).update(chat.id, {
          waiting: true,
          answerStatus: AnswerStatus.PENDING,
          state: 'done',
          updatedAt: new Date(),
        });
        return {
          userMessage,
          botMessage,
          removedFileIds: [...new Set(removedFileIds)],
        };
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw this.databaseError();
    }
  }

  private getAttachmentId(attachment: unknown): string | undefined {
    if (typeof attachment === 'string') {
      return attachment;
    }
    if (attachment && typeof attachment === 'object' && 'fileId' in attachment) {
      const fileId = (attachment as { fileId?: unknown }).fileId;
      return typeof fileId === 'string' ? fileId : undefined;
    }
    return undefined;
  }

  private async attachmentsForAi(
    currentAttachments: Upload[],
    userMessage: ChatMessage,
    username: string,
    projectId: string | undefined,
    historyId: string | undefined,
    selectionMode: SelectionMode
  ): Promise<Upload[]> {
    if (!this.usesDetectIntent(selectionMode)) {
      return currentAttachments;
    }

    let ragMessages: ChatMessage[];
    try {
      ragMessages = await this.messagesRepository.find({
        where: {
          chatId: userMessage.chatId,
          bot: false,
          messageType: SelectionMode.RAG,
          sequence: LessThan(userMessage.sequence),
        },
      });
    } catch {
      throw this.databaseError();
    }

    const ragAttachmentIds = ragMessages.flatMap((message) =>
      message.attachments.map((attachment) => this.getAttachmentId(attachment)).filter((fileId): fileId is string => Boolean(fileId))
    );
    const currentRagAttachmentIds = selectionMode === SelectionMode.RAG ? currentAttachments.map((attachment) => attachment.fileId) : [];
    const fileIds = [...new Set([...ragAttachmentIds, ...currentRagAttachmentIds])];
    return fileIds.length ? this.uploadsService.findAttachments(fileIds, username, projectId, historyId) : [];
  }

  private async createMessagePair(
    chatId: string,
    username: string,
    dto: SendMessageDto,
    attachments: unknown[],
    projectId: string | undefined,
    selectionMode: SelectionMode
  ): Promise<MessagePair> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const chat = await manager.getRepository(Chat).findOne({
          where: {
            id: chatId,
            username,
            projectId: projectId ?? IsNull(),
          },
          lock: { mode: 'pessimistic_write' },
        });

        if (!chat) {
          throw new NotFoundException(this.messages.translate('conversation.notFound'));
        }

        const repository = manager.getRepository(ChatMessage);
        if (dto.messageId) {
          const duplicateMessage = await repository.findOne({
            where: { id: dto.messageId },
          });
          if (duplicateMessage) {
            throw new ConflictException(this.messages.translate('conversation.duplicateMessage'));
          }
        }

        const lastMessage = await repository.findOne({
          where: { chatId },
          order: { sequence: 'DESC' },
        });

        if (lastMessage?.bot === false) {
          throw new ConflictException(this.messages.translate('conversation.consecutiveUserMessages'));
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
          answerStatus: AnswerStatus.PENDING,
        });

        await repository.save(userMessage);
        await repository.save(botMessage);
        await manager.getRepository(Chat).update(chat.id, {
          updatedAt: new Date(),
        });
        this.logger.info(StreamService.name, 'Message pair stored', {
          username,
          chatId,
          userMessageId: userMessage.id,
          botMessageId: botMessage.id,
        });
        return [userMessage, botMessage];
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw this.databaseError();
    }
  }

  private createMessageId(): string {
    return randomInt(10_000_000_000_000, 99_999_999_999_999).toString();
  }

  private currentMessageFileIds(uploadedFileIds: string[], messageFileIds: string[] = [], legacyFileIds: string[] = []): string[] {
    const currentFileIds = uploadedFileIds.length ? uploadedFileIds : messageFileIds.length ? messageFileIds : legacyFileIds;
    return [...new Set(currentFileIds)];
  }

  private requestedletter_operation(dto: StreamMessageDto, fallback?: string): string | undefined {
    const value: unknown = (dto as unknown as Record<string, unknown>)['letter_operation'];
    return typeof value === 'string' ? value : fallback;
  }

  private async initialHistoryName(
    message: string,
    text: string,
    fileIds: string[],
    uploadedFiles: Upload[],
    username: string,
    projectId: string | undefined,
    historyId: string,
    selectionMode: SelectionMode
  ): Promise<string> {
    if (this.usesDetectIntent(selectionMode)) {
      return message.slice(0, 100);
    }

    const files = uploadedFiles.length ? uploadedFiles : await this.uploadsService.findAttachments(fileIds, username, projectId, historyId);
    const fileById = new Map(files.map((file) => [file.fileId, file]));
    const filename = fileIds.map((fileId) => fileById.get(fileId)?.filename).find(Boolean);

    return `${SELECTION_MODE_HISTORY_TITLE[selectionMode]} فایل ${filename ?? text}`;
  }

  private usesDetectIntent(selectionMode: SelectionMode): boolean {
    return selectionMode === SelectionMode.RAG || selectionMode === SelectionMode.GENERAL_CHAT;
  }

  private async processAiStream({
    username,
    prompt,
    attachments,
    userMessage,
    text,
    letter_operation,
    translate,
    botMessage,
    scope,
    historyId,
    selectionMode,
    projectId,
  }: AiStreamContext): Promise<void> {
    const payload = {
      chatId: historyId ?? botMessage.chatId,
      historyId: historyId ?? botMessage.chatId,
      messageId: botMessage.id,
      scope,
    };
    let streamedMessage = '';
    let socketAttachments: Upload[] = attachments;
    let socketPayload = {
      ...payload,
      attachments: this.toMessageAttachments(socketAttachments),
    };
    let aiResponded = false;
    let aiTimedOut = false;
    let streamingStatusUpdate: Promise<void> | undefined;
    const abortController = new AbortController();
    this.activeStreamControllers.set(username, {
      historyId: payload.historyId,
      controller: abortController,
    });
    let responseTimeout: ReturnType<typeof setTimeout> | undefined;
    const markAiResponse = (): void => {
      if (aiResponded) return;

      aiResponded = true;
      clearTimeout(responseTimeout);
      this.clearStreamLockTimer(username, payload.historyId);
    };
    const emitChunk = (token: string): void => {
      if (aiTimedOut || abortController.signal.aborted) return;

      markAiResponse();
      if (!streamingStatusUpdate) {
        // A `text` payload is the first actual response chunk.  Keep the
        // placeholder pending until this point, then transition it together
        // with its selection-mode -> text socket representation.
        streamingStatusUpdate = this.updateAnswerStatus(botMessage, AnswerStatus.STREAMING);
      }
      streamedMessage += token;
      this.socketEventsService.token(username, {
        ...socketPayload,
        token,
        message: streamedMessage,
        messages: this.toStreamMessages(userMessage, botMessage, StreamMessageType.TEXT, streamedMessage, socketAttachments),
      });
    };

    try {
      const [previousMessages, chat, files] = await Promise.all([
        this.messagesRepository.find({
          where: {
            chatId: userMessage.chatId,
            sequence: LessThan(userMessage.sequence),
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
      const history =
        previousMessages.length < 2
          ? Array.from({ length: 2 }, () => ({
              ...this.toSocketResponse(botMessage),
              id: this.createMessageId(),
              message: '',
            }))
          : previousMessages.slice(-12).map((message) => this.toSocketResponse(message));
      let generatedFile: { fileId: string; filename: string; downloadUrl: string } | undefined;
      const responseTimeoutMs = this.streamLockTimeoutMs();
      const aiRequest = this.danaService.stream(
        {
          userQuery: prompt,
          username,
          history,
          historyCount: this.historyCount(),
          text,
          letter_operation,
          translate,
          selectionMode,
          files,
        },
        (token) => emitChunk(token),
        chat?.modelName,
        async (file) => {
          if (aiTimedOut || abortController.signal.aborted) return;

          markAiResponse();
          const upload = await this.uploadsService.registerGeneratedAiFile(username, file.objectKey, file.bucket, historyId ?? botMessage.chatId, projectId);
          if (abortController.signal.aborted) return;

          botMessage.attachments = [{ fileId: upload.fileId }];
          generatedFile = {
            fileId: upload.fileId,
            filename: upload.filename,
            downloadUrl: `/chat/api/uploads/${upload.fileId}/download`,
          };
        },
        abortController.signal
      );
      let timeout: Promise<never> | undefined;
      if (responseTimeoutMs !== undefined) {
        timeout = new Promise<never>((_resolve, reject) => {
          responseTimeout = setTimeout(() => {
            if (aiResponded) return;

            aiTimedOut = true;
            abortController.abort();
            reject(new Error('AI stream response timed out'));
          }, responseTimeoutMs);
          responseTimeout.unref?.();
        });
      }
      const answer = await Promise.race(timeout ? [aiRequest, timeout] : [aiRequest]);
      if (abortController.signal.aborted && !aiTimedOut) return;

      if (!answer.trim() && !generatedFile) {
        throw new Error('AI service returned an empty answer');
      }
      await streamingStatusUpdate;
      botMessage.message = answer;
      botMessage.text = text;
      botMessage.answerStatus = AnswerStatus.COMPLETED;

      await this.messagesRepository.save(botMessage);
      await this.chatsRepository.update(botMessage.chatId, {
        waiting: false,
        isActive: false,
        state: 'done',
        answerStatus: AnswerStatus.COMPLETED,
      });
      await this.emitNewHistory(username, projectId);
      this.socketEventsService.end(username, {
        ...socketPayload,
        type: StreamMessageType.DONE,
        message: answer,
        ...(generatedFile ? { file: generatedFile } : {}),
        messages: this.toStreamMessages(userMessage, botMessage, StreamMessageType.DONE, answer, socketAttachments),
      });
    } catch (error) {
      if (abortController.signal.aborted && !aiTimedOut) return;

      await streamingStatusUpdate?.catch(() => undefined);

      const aiErrorMessage = aiTimedOut
        ? this.messages.translate('conversation.aiTimeout')
        : isServiceUnavailableError(error)
          ? this.messages.translate('conversation.aiUnavailable')
          : (httpExceptionMessage(error) ?? this.messages.translate('conversation.aiFailed'));
      botMessage.message = aiErrorMessage;
      botMessage.answerStatus = AnswerStatus.FAILED;
      await this.messagesRepository.save(botMessage).catch(() => undefined);
      await this.chatsRepository
        .update(botMessage.chatId, {
          waiting: false,
          isActive: false,
          state: 'failure',
          answerStatus: AnswerStatus.FAILED,
        })
        .catch(() => undefined);
      await this.emitNewHistory(username, projectId);
      this.socketEventsService.error(username, {
        ...socketPayload,
        type: StreamMessageType.FAILURE,
        message: aiErrorMessage,
        messages: this.toStreamMessages(userMessage, botMessage, StreamMessageType.FAILURE, aiErrorMessage, socketAttachments),
      });
      this.socketEventsService.token(username, {
        ...socketPayload,
        type: StreamMessageType.FAILURE,
        token: aiErrorMessage,
        message: aiErrorMessage,
        messages: this.toStreamMessages(userMessage, botMessage, StreamMessageType.FAILURE, aiErrorMessage, socketAttachments),
      });
      this.socketEventsService.end(username, {
        ...socketPayload,
        type: StreamMessageType.FAILURE,
        message: aiErrorMessage,
        messages: this.toStreamMessages(userMessage, botMessage, StreamMessageType.FAILURE, aiErrorMessage, socketAttachments),
      });
      this.logger.failure(StreamService.name, 'AI stream processing failed', error, {
        username,
        historyId,
        chatId: botMessage.chatId,
        messageId: botMessage.id,
      });
    } finally {
      if (responseTimeout) clearTimeout(responseTimeout);
      const activeController = this.activeStreamControllers.get(username);
      if (activeController?.controller === abortController) {
        this.activeStreamControllers.delete(username);
      }
      this.releaseStream(username, payload.historyId);
    }
  }

  private cancelActiveStream(username: string, historyId: string): void {
    const activeController = this.activeStreamControllers.get(username);
    if (activeController?.historyId === historyId) {
      activeController.controller.abort();
      this.activeStreamControllers.delete(username);
    }
    this.releaseStream(username, historyId);
  }

  private releaseStream(username: string, historyId: string): void {
    if (this.activeStreams.get(username) !== historyId) return;

    this.activeStreams.delete(username);
    const timer = this.streamLockTimers.get(username);
    if (timer) clearTimeout(timer);
    this.streamLockTimers.delete(username);
  }

  private clearStreamLockTimer(username: string, historyId: string): void {
    if (this.activeStreams.get(username) !== historyId) return;

    const timer = this.streamLockTimers.get(username);
    if (timer) clearTimeout(timer);
    this.streamLockTimers.delete(username);
  }

  private lockStream(username: string, historyId: string): void {
    this.activeStreams.set(username, historyId);

    const timeoutMs = this.streamLockTimeoutMs();
    if (timeoutMs === undefined) return;

    const timer = setTimeout(() => this.expireStreamLock(username, historyId), timeoutMs);
    timer.unref?.();
    this.streamLockTimers.set(username, timer);
  }

  private expireStreamLock(username: string, historyId: string): void {
    if (this.activeStreams.get(username) !== historyId) return;

    this.activeStreams.delete(username);
    this.streamLockTimers.delete(username);
    this.logger.warning(StreamService.name, 'Chat stream lock expired', { username, historyId });
  }

  private streamLockTimeoutMs(): number | undefined {
    const seconds = Number(this.configService.get<string>('STREAM_LOCK_TIMEOUT_SECONDS', '0'));
    return Number.isFinite(seconds) && seconds > 0 ? seconds * 1_000 : undefined;
  }

  private historyCount(): number {
    const value = Number(this.configService.get<string>('HISTORY_COUNT', '1'));
    return Number.isInteger(value) && value >= 0 ? value : 1;
  }

  private requestHistoryNameUpdate(chatId: string, userQuery: string, username: string, historyId: string, collectionId?: string, projectId?: string, modelName?: string): void {
    setImmediate(() => void this.updateHistoryName(chatId, userQuery, username, historyId, collectionId, projectId, modelName));
  }

  private async updateHistoryName(
    chatId: string,
    userQuery: string,
    username: string,
    historyId: string,
    collectionId?: string,
    projectId?: string,
    modelName?: string
  ): Promise<void> {
    try {
      const modelConfigs = await this.danaService.createModelConfigs(username, modelName);
      const historyName: string = await this.danaService.detectIntent({
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
        answerStatus: chat?.answerStatus ?? AnswerStatus.PENDING,
      });
    } catch (error) {
      this.logger.failure(StreamService.name, 'Could not update conversation history name', error, {
        username,
        chatId,
      });
    }
  }

  private async emitNewHistory(username: string, projectId?: string): Promise<void> {
    try {
      this.socketEventsService.newHistory(username, await this.getHistories(username, projectId));
    } catch (error) {
      this.logger.failure(StreamService.name, 'Could not emit updated conversation history', error, {
        username,
        scope: projectId ? 'project' : 'general',
      });
    }
  }

  private async updateAnswerStatus(botMessage: ChatMessage, answerStatus: AnswerStatus): Promise<void> {
    botMessage.answerStatus = answerStatus;
    await Promise.all([this.messagesRepository.update({ id: botMessage.id }, { answerStatus }), this.chatsRepository.update(botMessage.chatId, { answerStatus })]);
  }

  private toStreamMessages(userMessage: ChatMessage, botMessage: ChatMessage, botType: StreamMessageType | SelectionMode, botText = '', attachments: Upload[] = []) {
    const isFinished = botType === StreamMessageType.DONE || botType === StreamMessageType.FAILURE;
    return [userMessage, botMessage].map((message) => {
      if (message.id === userMessage.id) {
        return {
          ...this.toSocketResponse(message),
          type: isFinished ? StreamMessageType.TEXT : botType,
          attachments: this.toMessageAttachments(attachments),
        };
      }
      if (message.id === botMessage.id) {
        return { ...this.toSocketResponse(message), type: botType, message: botText };
      }
      return this.toSocketResponse(message);
    });
  }

  private toMessageAttachments(attachments: Upload[]) {
    return attachments.map(({ fileId, originalName, mimeType, size }) => ({
      fileId,
      originalName,
      mimeType,
      size,
    }));
  }

  private toResponse(message: ChatMessage) {
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

  private async toHistory(chat: Chat, username: string, projectId?: string) {
    let messages: ChatMessage[];
    try {
      messages = await this.messagesRepository.find({
        where: { chatId: chat.id },
        order: { sequence: 'ASC' },
      });
    } catch {
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

  private toSocketResponse(message: ChatMessage) {
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

  private databaseError(): ServiceUnavailableException {
    return new ServiceUnavailableException(this.messages.translate('common.databaseUnavailable'));
  }

  private validateMessageLength(message: string | undefined): void {
    if ((message?.length ?? 0) > this.configService.get<number>('MESSAGE_LENGTH', 260)) {
      throw this.toLongMessage();
    }
  }

  private startUserStream(username: string, historyId: string): void {
    if (this.activeStreams.has(username)) {
      this.logger.warning(StreamService.name, 'Chat request rejected because another stream is active', {
        username,
        historyId,
        activeHistoryId: this.activeStreams.get(username),
      });
      throw new ConflictException(this.messages.translate('conversation.activeStream'));
    }
    this.lockStream(username, historyId);
  }

  private conversationWhere(username: string, historyId: string, projectId?: string): FindOptionsWhere<Chat> {
    return {
      username,
      projectId: projectId ?? IsNull(),
      ...(projectId ? { sessionId: historyId } : { historyId }),
    };
  }

  private toLongMessage() {
    return new BadRequestException(this.messages.translate('common.toLongMessage'));
  }

  private async resolveProjectId(collectionId: string | null | undefined, username: string): Promise<string | undefined> {
    if (!collectionId) {
      return undefined;
    }

    let project: Project | null;
    try {
      project = await this.projectsRepository.findOneBy({
        collectionId,
        username,
      });
    } catch {
      throw this.databaseError();
    }

    if (!project) {
      throw new NotFoundException(this.messages.translate('project.notFound'));
    }
    return project.id;
  }
}

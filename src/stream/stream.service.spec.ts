import type { DataSource, Repository } from 'typeorm';
import type { ConfigService } from '@nestjs/config';
import type { DanaService } from '../dana/dana.service';
import { HttpException } from '@nestjs/common';
import type { LogManager } from '../common/logger/log-manager.service';
import type { I18nMessageService } from '../common/i18n/i18n-message.service';
import type { UploadsService } from '../uploads/uploads.service';
import { Upload } from '../uploads/entities/upload.entity';
import type { Project } from '../projects/entities/project.entity';
import { StreamService } from './stream.service';
import type { SendMessageDto } from './dto/send-message.dto';
import type { StreamMessageDto } from './dto/stream-message.dto';
import { ChatMessage } from './entities/chat-message.entity';
import { Chat } from './entities/chat.entity';
import { MessageType } from './enums/message-type.enum';
import { SelectionMode } from './enums/selection-mode.enum';
import { StreamScope } from './enums/stream-scope.enum';
import type { SocketEventsService } from '../socket/services/socket-events.service';

describe('StreamService', () => {
  const createService = (
    findMessage: jest.Mock = jest.fn().mockResolvedValue(null),
    aiStream: jest.Mock = jest.fn().mockRejectedValue(new Error('AI is unavailable')),
    lockTimeoutSeconds = '60'
  ) => {
    const chatRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 'chat-id' }),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const messageRepository = {
      findOne: findMessage,
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn().mockResolvedValue(
        Object.assign(new ChatMessage(), {
          id: 'user-message-id',
          chatId: 'chat-id',
          sequence: 1,
          message: 'پیام قبلی',
          bot: false,
          attachments: [],
          createdAt: new Date(),
        })
      ),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      create: jest.fn((value: Partial<ChatMessage>) =>
        Object.assign(new ChatMessage(), {
          unread: true,
          type: 'text',
          avatar: '',
          attachments: [],
          liked: false,
          disLiked: false,
          starred: false,
          createdAt: new Date(),
          comment: '',
          translate: [],
          reply: [],
          ...value,
        })
      ),
      save: jest.fn((message: ChatMessage): Promise<ChatMessage> => Promise.resolve(message)),
    };
    const manager = {
      getRepository: jest.fn((entity) => (entity === Chat ? chatRepository : messageRepository)),
    };
    const dataSource = {
      transaction: jest.fn((callback: (value: typeof manager) => Promise<[ChatMessage, ChatMessage]>) => callback(manager)),
    } as unknown as DataSource;
    const removeByHistory = jest.fn().mockResolvedValue(undefined);
    const removeFile = jest.fn().mockResolvedValue(undefined);
    const discardTemporaryFiles = jest.fn().mockResolvedValue(undefined);
    const findAttachments = jest.fn().mockResolvedValue([]);
    const uploadsService = {
      findAttachments,
      remove: removeFile,
      removeByHistory,
      discardTemporaryFiles,
    } as unknown as UploadsService;
    const aiGateway = {
      stream: aiStream,
    } as unknown as DanaService;
    const streamError = jest.fn();
    const streamEnd = jest.fn();
    const streamStart = jest.fn();
    const streamToken = jest.fn();
    const streamNewHistory = jest.fn();
    const streamCancel = jest.fn();
    const chatStream = {
      start: streamStart,
      token: streamToken,
      end: streamEnd,
      error: streamError,
      newHistory: streamNewHistory,
      cancel: streamCancel,
    } as unknown as SocketEventsService;
    const logger = {
      error: jest.fn(),
      info: jest.fn(),
      failure: jest.fn(),
      warning: jest.fn(),
    } as unknown as LogManager;
    const findOwnedChat = jest.fn().mockResolvedValue(null);
    const updateChatState = jest.fn().mockResolvedValue({ affected: 1 });
    const findChats = jest.fn().mockResolvedValue([]);
    const deleteChats = jest.fn().mockResolvedValue({ affected: 0 });
    const chatsRepository = {
      findOneBy: findOwnedChat,
      find: jest.fn().mockResolvedValue([]),
      findBy: findChats,
      delete: deleteChats,
      update: updateChatState,
    } as unknown as Repository<Chat>;

    const service = new StreamService(
      chatsRepository,
      messageRepository as unknown as Repository<ChatMessage>,
      {} as Repository<Project>,
      dataSource,
      uploadsService,
      aiGateway,
      chatStream,
      logger,
      {
        translate: (key: string) => {
          const values: Record<string, string> = {
            'conversation.aiFailed': 'دستیار زبانی در پاسخ دادن به مشکل برخورد کرد، لطفا مجددا امتحان کنید',
            'conversation.aiTimeout': 'دستیار زبانی پاسخ نداد',
            'conversation.duplicateMessage': 'پیامی با این id قبلاً ثبت شده است',
            'conversation.consecutiveUserMessages': 'دو پیام متوالی کاربر مجاز نیست',
          };
          return values[key] ?? key;
        },
      } as I18nMessageService,
      {
        get: jest.fn((key: string, defaultValue: unknown) => (key === 'STREAM_LOCK_TIMEOUT_SECONDS' ? lockTimeoutSeconds : defaultValue)),
      } as unknown as ConfigService
    );

    return {
      service,
      streamError,
      streamEnd,
      streamStart,
      streamToken,
      streamNewHistory,
      streamCancel,
      chatRepository,
      findOwnedChat,
      findChats,
      deleteChats,
      removeByHistory,
      removeFile,
      discardTemporaryFiles,
      updateChatState,
      messageRepository,
      uploadsService,
      findAttachments,
    };
  };

  it('keeps only attachments belonging to the current message', () => {
    const { service } = createService();
    const currentMessageFileIds = (
      service as unknown as {
        currentMessageFileIds: (uploaded: string[], message: string[], legacy: string[]) => string[];
      }
    ).currentMessageFileIds.bind(service);

    expect(currentMessageFileIds(['new-upload'], ['previous-1', 'previous-2'], ['previous-3'])).toEqual(['new-upload']);
    expect(currentMessageFileIds([], ['selected-file'], ['previous-file'])).toEqual(['selected-file']);
    expect(currentMessageFileIds([], [], ['legacy-selected-file'])).toEqual(['legacy-selected-file']);
    expect(currentMessageFileIds(['same-file'], ['same-file'], ['same-file'])).toEqual(['same-file']);
    expect(currentMessageFileIds([], [], [])).toEqual([]);
  });

  it.each([SelectionMode.RAG, SelectionMode.GENERAL_CHAT])('uses attachments from every RAG message for %s in the same conversation', async (selectionMode) => {
    const { service, messageRepository, findAttachments } = createService();
    const historicalAttachment = Object.assign(new Upload(), { fileId: 'historical-file' });
    const currentAttachment = Object.assign(new Upload(), { fileId: 'current-file' });
    messageRepository.find.mockResolvedValue([
      Object.assign(new ChatMessage(), { messageType: SelectionMode.RAG, attachments: [{ fileId: 'historical-file' }] }),
      Object.assign(new ChatMessage(), { messageType: SelectionMode.RAG, attachments: [{ fileId: 'current-file' }] }),
    ]);
    findAttachments.mockResolvedValue([historicalAttachment, currentAttachment]);
    const attachmentsForAi = (
      service as unknown as {
        attachmentsForAi: (
          attachments: Upload[],
          userMessage: ChatMessage,
          username: string,
          projectId: string | undefined,
          historyId: string,
          selectionMode: SelectionMode
        ) => Promise<Upload[]>;
      }
    ).attachmentsForAi.bind(service);

    await expect(attachmentsForAi([], Object.assign(new ChatMessage(), { chatId: 'chat-id' }), 'user', undefined, 'history-id', selectionMode)).resolves.toEqual([
      historicalAttachment,
      currentAttachment,
    ]);

    expect(findAttachments).toHaveBeenCalledWith(['historical-file', 'current-file'], 'user', undefined, 'history-id');
    expect(messageRepository.find).toHaveBeenCalledWith({
      // Jest's asymmetric matcher is required because the query also includes a TypeORM FindOperator.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where: expect.objectContaining({
        chatId: 'chat-id',
        bot: false,
        messageType: SelectionMode.RAG,
      }),
    });
  });

  it('keeps only current-message attachments for non-RAG modes', async () => {
    const { service, messageRepository } = createService();
    const currentAttachment = Object.assign(new Upload(), { fileId: 'current-file' });
    const attachmentsForAi = (
      service as unknown as {
        attachmentsForAi: (
          attachments: Upload[],
          userMessage: ChatMessage,
          username: string,
          projectId: string | undefined,
          historyId: string,
          selectionMode: SelectionMode
        ) => Promise<Upload[]>;
      }
    ).attachmentsForAi.bind(service);

    await expect(
      attachmentsForAi([currentAttachment], Object.assign(new ChatMessage(), { chatId: 'chat-id' }), 'user', undefined, 'history-id', SelectionMode.SUMMARIZER)
    ).resolves.toEqual([currentAttachment]);

    expect(messageRepository.find).not.toHaveBeenCalled();
  });

  it('does not attach the current general-chat file with historical RAG files', async () => {
    const { service, messageRepository, findAttachments } = createService();
    const ragAttachment = Object.assign(new Upload(), { fileId: 'rag-file' });
    const generalAttachment = Object.assign(new Upload(), { fileId: 'general-file' });
    messageRepository.find.mockResolvedValue([Object.assign(new ChatMessage(), { messageType: SelectionMode.RAG, attachments: [{ fileId: 'rag-file' }] })]);
    findAttachments.mockResolvedValue([ragAttachment]);
    const attachmentsForAi = (
      service as unknown as {
        attachmentsForAi: (
          attachments: Upload[],
          userMessage: ChatMessage,
          username: string,
          projectId: string | undefined,
          historyId: string,
          selectionMode: SelectionMode
        ) => Promise<Upload[]>;
      }
    ).attachmentsForAi.bind(service);

    await expect(
      attachmentsForAi([generalAttachment], Object.assign(new ChatMessage(), { chatId: 'chat-id', sequence: 5 }), 'user', undefined, 'history-id', SelectionMode.GENERAL_CHAT)
    ).resolves.toEqual([ragAttachment]);

    expect(findAttachments).toHaveBeenCalledWith(['rag-file'], 'user', undefined, 'history-id');
  });

  it('stores only historical RAG attachments on a new general-chat message', async () => {
    const aiStream = jest.fn().mockResolvedValue('پاسخ');
    const { service, messageRepository, findAttachments } = createService(jest.fn().mockResolvedValue(null), aiStream);
    const ragAttachment = Object.assign(new Upload(), { fileId: 'rag-file', originalName: 'source.pdf', mimeType: 'application/pdf', size: 42 });
    const userMessage = Object.assign(new ChatMessage(), {
      id: 'general-message',
      chatId: 'chat-id',
      sequence: 3,
      message: 'سوال عمومی',
      bot: false,
      attachments: [{ fileId: 'general-file' }],
      createdAt: new Date(),
    });
    const botMessage = Object.assign(new ChatMessage(), {
      id: 'bot-message',
      chatId: 'chat-id',
      sequence: 4,
      message: '',
      bot: true,
      attachments: [],
      createdAt: new Date(),
    });
    messageRepository.find.mockImplementation(({ where }: { where: { messageType?: SelectionMode } }) =>
      Promise.resolve(where.messageType === SelectionMode.RAG ? [Object.assign(new ChatMessage(), { attachments: [{ fileId: 'rag-file' }] })] : [])
    );
    findAttachments.mockResolvedValue([ragAttachment]);
    const processAiStream = (
      service as unknown as {
        processAiStream: (context: {
          username: string;
          prompt: string;
          attachments: Upload[];
          userMessage: ChatMessage;
          text: string;
          botMessage: ChatMessage;
          scope: StreamScope;
          historyId: string;
          selectionMode: SelectionMode;
        }) => Promise<void>;
      }
    ).processAiStream.bind(service);

    await processAiStream({
      username: 'user',
      prompt: 'سوال عمومی',
      attachments: [Object.assign(new Upload(), { fileId: 'general-file' })],
      userMessage,
      text: '',
      botMessage,
      scope: StreamScope.GENERAL,
      historyId: 'history-id',
      selectionMode: SelectionMode.GENERAL_CHAT,
    });

    expect(messageRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'general-message',
        attachments: [{ fileId: 'rag-file', originalName: 'source.pdf', mimeType: 'application/pdf', size: 42 }],
      })
    );
  });

  it('includes selected RAG attachments and the user selection mode in Socket messages', () => {
    const { service } = createService();
    const toStreamMessages = (
      service as unknown as {
        toStreamMessages: (userMessage: ChatMessage, botMessage: ChatMessage, type: SelectionMode, text: string, attachments: Upload[]) => unknown[];
      }
    ).toStreamMessages.bind(service);
    const userMessage = Object.assign(new ChatMessage(), {
      id: 'message-id',
      type: 'text',
      selectionMode: SelectionMode.GENERAL_CHAT,
      message: 'سوال',
      text: '',
      bot: false,
      attachments: [],
      translate: [],
      createdAt: new Date(),
    });
    const botMessage = Object.assign(new ChatMessage(), {
      id: 'bot-message-id',
      type: 'text',
      message: '',
      text: '',
      bot: true,
      attachments: [],
      translate: [],
      createdAt: new Date(),
    });

    expect(
      toStreamMessages(userMessage, botMessage, SelectionMode.GENERAL_CHAT, '', [
        Object.assign(new Upload(), { fileId: 'rag-file', originalName: 'source.pdf', mimeType: 'application/pdf', size: 42 }),
      ])
    ).toEqual([
      expect.objectContaining({
        selectionMode: SelectionMode.GENERAL_CHAT,
        attachments: [{ fileId: 'rag-file', originalName: 'source.pdf', mimeType: 'application/pdf', size: 42 }],
      }),
      expect.any(Object),
    ]);
  });

  it.each([
    ['general', undefined],
    ['project', 'project-id'],
  ])('does not attach non-RAG files to general chat for %s conversations', async (_scope, projectId) => {
    const aiStream = jest.fn().mockResolvedValue('پاسخ');
    const { service, findAttachments } = createService(jest.fn().mockResolvedValue(null), aiStream);
    const attachment = Object.assign(new Upload(), {
      fileId: 'file-id',
      objectName: 'user/attachments/file-id/document.pdf',
      bucket: 'dana-client',
      originalName: 'document.pdf',
      mimeType: 'application/pdf',
      size: 1024,
    });
    findAttachments.mockResolvedValue([attachment]);

    await service.sendMessage(
      'chat-id',
      'user',
      {
        message: 'فایل را بررسی کن',
        attachments: ['file-id'],
      },
      projectId,
      'history-id'
    );
    await new Promise((resolve) => setImmediate(resolve));

    expect(findAttachments).toHaveBeenCalledWith(['file-id'], 'user', projectId, 'history-id');
    expect(aiStream).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'user',
        files: [],
      }),
      expect.any(Function),
      undefined,
      expect.any(Function),
      expect.any(AbortSignal)
    );
  });

  it.each([
    [SelectionMode.TRANSLATOR, 'ترجمه فایل current.pdf'],
    [SelectionMode.EMBEDDER, 'جاسازی فایل current.pdf'],
    [SelectionMode.KEYWORD_EXTRACTOR, 'استخراج‌ کلمات کلیدی فایل current.pdf'],
    [SelectionMode.MINUTES_GENERATOR, 'ساخت صورت جلسه فایل current.pdf'],
    [SelectionMode.NER, 'ner فایل current.pdf'],
    [SelectionMode.OCR, 'ocr فایل current.pdf'],
    [SelectionMode.SENTIMENT_ANALYZER, 'تحلیلگر احساسات فایل current.pdf'],
    [SelectionMode.SUMMARIZER, 'خلاصه‌کننده فایل current.pdf'],
    [SelectionMode.LETTER, 'نامه نگار فایل current.pdf'],
    [SelectionMode.STT, 'تبدیل صدا به متن فایل current.pdf'],
    [SelectionMode.REPORTER, 'گزارش‌گر فایل current.pdf'],
  ])('uses the localized selection mode title and current file name for %s histories', async (selectionMode, expectedHistoryName) => {
    const { service, findAttachments } = createService();
    const currentFile = Object.assign(new Upload(), {
      fileId: 'current-file',
      filename: 'current.pdf',
    });
    findAttachments.mockResolvedValue([currentFile]);
    const initialHistoryName = (
      service as unknown as {
        initialHistoryName: (
          message: string,
          text: string,
          fileIds: string[],
          uploadedFiles: Upload[],
          username: string,
          projectId: string | undefined,
          historyId: string,
          selectionMode: SelectionMode
        ) => Promise<string>;
      }
    ).initialHistoryName.bind(service);

    await expect(initialHistoryName('درخواست', 'متن جایگزین', ['current-file'], [], 'user', undefined, 'history-id', selectionMode)).resolves.toBe(expectedHistoryName);
    expect(findAttachments).toHaveBeenCalledWith(['current-file'], 'user', undefined, 'history-id');
  });

  it('keeps message-based history names for RAG and uses text when a non-RAG file name is unavailable', async () => {
    const { service, findAttachments } = createService();
    const initialHistoryName = (
      service as unknown as {
        initialHistoryName: (
          message: string,
          text: string,
          fileIds: string[],
          uploadedFiles: Upload[],
          username: string,
          projectId: string | undefined,
          historyId: string,
          selectionMode: SelectionMode
        ) => Promise<string>;
      }
    ).initialHistoryName.bind(service);

    await expect(initialHistoryName('گفت‌وگو', 'متن جایگزین', ['current-file'], [], 'user', undefined, 'history-id', SelectionMode.RAG)).resolves.toBe('گفت‌وگو');
    expect(findAttachments).not.toHaveBeenCalled();

    findAttachments.mockResolvedValue([]);
    await expect(initialHistoryName('خلاصه کن', 'متن جایگزین', [], [], 'user', undefined, 'history-id', SelectionMode.SUMMARIZER)).resolves.toBe('خلاصه‌کننده فایل متن جایگزین');
  });

  it('retries an existing user message and removes every following message', async () => {
    const aiStream = jest.fn().mockResolvedValue('پاسخ جدید');
    const { service, messageRepository, discardTemporaryFiles } = createService(jest.fn().mockResolvedValue(null), aiStream);

    await service.process(
      {
        retry: true,
        historyId: 'history-id',
        selectionMode: 'generalChat',
        fileIds: [],
        messageSchema: {
          message: {
            id: 'user-message-id',
            unread: false,
            type: MessageType.TEXT,
            message: '',
            bot: false,
            avatar: '',
            attachments: [],
            liked: false,
            disLiked: false,
            starred: false,
            delivered: false,
            comment: '',
            reply: [],
          },
        },
      } as StreamMessageDto,
      'user'
    );
    await new Promise((resolve) => setImmediate(resolve));

    expect(discardTemporaryFiles).toHaveBeenCalledWith([]);
    expect(messageRepository.delete).toHaveBeenCalledWith({
      chatId: 'chat-id',
      sequence: expect.anything() as unknown,
    });
    expect(aiStream).toHaveBeenCalledWith(
      expect.objectContaining({ userQuery: 'پیام قبلی' }),
      expect.any(Function) as (token: string) => void,
      undefined,
      expect.any(Function) as () => void,
      expect.anything()
    );
  });

  it('removes all general histories and their files for the current user', async () => {
    const { service, findChats, deleteChats, removeByHistory, streamCancel } = createService();
    findChats.mockResolvedValue([Object.assign(new Chat(), { id: 'chat-1', historyId: 'history-1' }), Object.assign(new Chat(), { id: 'chat-2', historyId: 'history-2' })]);

    await expect(service.removeAllGeneralHistories('user')).resolves.toBe(2);
    expect(removeByHistory).toHaveBeenNthCalledWith(1, 'user', 'history-1');
    expect(removeByHistory).toHaveBeenNthCalledWith(2, 'user', 'history-2');
    expect(deleteChats).toHaveBeenCalledWith(expect.objectContaining({ username: 'user', type: 'general' }));
    expect(streamCancel).toHaveBeenCalledTimes(2);
  });

  it('always creates a user and bot message pair when AI fails', async () => {
    const { service, streamError, streamEnd, streamStart, chatRepository } = createService();
    const dto: SendMessageDto = {
      message: 'سلام',
      attachments: [],
    };

    const messages = await service.sendMessage('chat-id', 'user', dto);
    await new Promise((resolve) => setImmediate(resolve));

    expect(messages.map(({ bot }) => bot)).toEqual([false, true]);
    expect(messages[1]?.message).toBe('');
    expect(messages[1]?.answerStatus).toBe('pending');
    expect(streamStart).toHaveBeenCalledWith(
      'user',
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ bot: false, type: 'generalChat' }),
          expect.objectContaining({ bot: true, type: 'generalChat', answerStatus: 'pending' }),
        ]) as unknown[],
      })
    );
    expect(chatRepository.update).toHaveBeenCalledWith('chat-id', {
      updatedAt: expect.any(Date) as Date,
    });
    expect(streamError).toHaveBeenCalled();
    expect(streamEnd).toHaveBeenCalledWith(
      'user',
      expect.objectContaining({
        type: 'failure',
        messages: expect.arrayContaining([expect.objectContaining({ bot: true, type: 'failure', answerStatus: 'failure' })]) as unknown[],
      })
    );
  });

  it('shows the HTTP error message returned by the AI service in socket events', async () => {
    const aiStream = jest.fn().mockRejectedValue(new HttpException('مدل انتخاب‌شده در دسترس نیست', 503));
    const { service, streamError, streamEnd } = createService(jest.fn().mockResolvedValue(null), aiStream);

    await service.sendMessage('chat-id', 'user', {
      message: 'سلام',
      attachments: [],
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(streamError).toHaveBeenCalledWith(
      'user',
      expect.objectContaining({
        message: 'مدل انتخاب‌شده در دسترس نیست',
        messages: expect.arrayContaining([expect.objectContaining({ bot: true, message: 'مدل انتخاب‌شده در دسترس نیست' })]) as unknown[],
      })
    );
    expect(streamEnd).toHaveBeenCalledWith('user', expect.objectContaining({ message: 'مدل انتخاب‌شده در دسترس نیست' }));
  });

  it('rejects a duplicate message id', async () => {
    const { service } = createService(jest.fn().mockResolvedValue({ id: 'duplicate-id' }));

    await expect(
      service.sendMessage('chat-id', 'user', {
        messageId: 'duplicate-id',
        message: 'سلام',
        attachments: [],
      })
    ).rejects.toMatchObject({
      status: 409,
      message: 'پیامی با این id قبلاً ثبت شده است',
    });
  });

  it('updates a user message, removes its old answer, and starts a new AI response', async () => {
    const aiStream = jest.fn((_payload: unknown, onToken: (token: string) => void) => {
      onToken('تکه اول');
      onToken(' تکه دوم');
      return Promise.resolve('تکه اول تکه دوم');
    });
    const { service, messageRepository, streamStart, streamToken, streamEnd, streamNewHistory, updateChatState } = createService(jest.fn().mockResolvedValue(null), aiStream);

    await service.updateUserMessage(
      {
        historyId: 'history-id',
        messageId: 'user-message-id',
        message: 'پیام ویرایش‌شده',
      },
      'user'
    );
    await new Promise((resolve) => setImmediate(resolve));

    expect(messageRepository.delete).toHaveBeenCalledWith({
      chatId: 'chat-id',
      sequence: expect.anything() as unknown,
    });
    expect(messageRepository.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-message-id', message: 'پیام ویرایش‌شده', bot: false }));
    expect(streamStart).toHaveBeenCalledWith(
      'user',
      expect.objectContaining({
        historyId: 'history-id',
        messages: expect.arrayContaining([
          expect.objectContaining({ id: 'user-message-id', type: 'generalChat' }),
          expect.objectContaining({ bot: true, type: 'generalChat' }),
        ]) as unknown[],
      })
    );
    expect(streamToken).toHaveBeenCalledWith(
      'user',
      expect.objectContaining({
        messages: expect.arrayContaining([expect.objectContaining({ id: 'user-message-id', type: 'text' }), expect.objectContaining({ bot: true, type: 'text' })]) as unknown[],
      })
    );
    expect(streamToken).toHaveBeenCalledWith(
      'user',
      expect.objectContaining({
        messages: expect.arrayContaining([expect.objectContaining({ bot: true, type: 'text', answerStatus: 'streaming' })]) as unknown[],
      })
    );
    const tokenPayloads = streamToken.mock.calls as unknown as Array<[string, { message: string; messages: Array<{ bot: boolean; message: string }> }]>;
    expect(tokenPayloads.map(([, payload]) => payload.message)).toEqual(['تکه اول', 'تکه اول تکه دوم']);
    expect(tokenPayloads.map(([, payload]) => (payload.messages.find((message) => message.bot) as { message: string }).message)).toEqual(['تکه اول', 'تکه اول تکه دوم']);
    expect(streamEnd).toHaveBeenCalledWith(
      'user',
      expect.objectContaining({
        type: 'done',
        messages: expect.arrayContaining([expect.objectContaining({ id: 'user-message-id', type: 'text' }), expect.objectContaining({ bot: true, type: 'done' })]) as unknown[],
      })
    );
    expect(updateChatState).toHaveBeenCalledWith('chat-id', {
      waiting: false,
      isActive: false,
      state: 'done',
      answerStatus: 'completed',
    });
    expect(streamNewHistory).toHaveBeenCalledWith('user', []);
  });

  it('keeps attachments of the updated message and deletes only orphan files from following messages', async () => {
    const { service, messageRepository, removeFile } = createService();
    messageRepository.findOneBy.mockResolvedValueOnce(
      Object.assign(new ChatMessage(), {
        id: 'user-message-id',
        chatId: 'chat-id',
        sequence: 3,
        message: 'پیام دارای فایل',
        bot: false,
        attachments: [{ fileId: 'updated-file' }],
        createdAt: new Date(),
      })
    );
    messageRepository.find
      .mockResolvedValueOnce([Object.assign(new ChatMessage(), { attachments: [{ fileId: 'shared-file' }] })])
      .mockResolvedValueOnce([Object.assign(new ChatMessage(), { attachments: [{ fileId: 'following-file' }, { fileId: 'shared-file' }] })]);

    await service.updateUserMessage(
      {
        historyId: 'history-id',
        messageId: 'user-message-id',
        message: 'پیام ویرایش‌شده',
      },
      'user'
    );

    expect(messageRepository.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-message-id', attachments: [{ fileId: 'updated-file' }] }));
    expect(removeFile).toHaveBeenCalledTimes(1);
    expect(removeFile).not.toHaveBeenCalledWith('updated-file', 'user');
    expect(removeFile).toHaveBeenCalledWith('following-file', 'user');
    expect(removeFile).not.toHaveBeenCalledWith('shared-file', 'user');
  });

  it('returns the pending AI placeholder while a response is streaming', async () => {
    const { service, findOwnedChat, messageRepository } = createService();
    findOwnedChat.mockResolvedValue({ id: 'chat-id', waiting: true });
    messageRepository.find.mockResolvedValue([
      Object.assign(new ChatMessage(), { id: 'user-message', chatId: 'chat-id', sequence: 1, message: 'سلام', bot: false, createdAt: new Date() }),
      Object.assign(new ChatMessage(), { id: 'bot-message', chatId: 'chat-id', sequence: 2, message: '', bot: true, createdAt: new Date() }),
    ]);

    const messages = await service.getMessages('history-id', 'user', undefined, { limit: 10, offset: 20 });

    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({ id: 'user-message', bot: false });
    expect(messages[1]).toMatchObject({ id: 'bot-message', bot: true, message: '' });
    expect(messageRepository.find).toHaveBeenCalledWith({
      where: { chatId: 'chat-id' },
      order: { sequence: 'ASC' },
      take: 10,
      skip: 20,
    });
  });

  it('rejects two consecutive user messages', async () => {
    const findMessage = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ bot: false, sequence: 1 });
    const { service } = createService(findMessage);

    await expect(
      service.sendMessage('chat-id', 'user', {
        messageId: 'new-id',
        message: 'پیام دوم',
        attachments: [],
      })
    ).rejects.toMatchObject({
      status: 409,
      message: 'دو پیام متوالی کاربر مجاز نیست',
    });
  });

  it('expires a stalled stream lock after the configured duration', () => {
    jest.useFakeTimers();
    const { service } = createService(undefined, undefined, '1');
    const streamService = service as unknown as {
      startUserStream: (username: string, historyId: string) => void;
      releaseStream: (username: string, historyId: string) => void;
    };

    streamService.startUserStream('user', 'history-1');
    jest.advanceTimersByTime(1_000);

    expect(() => streamService.startUserStream('user', 'history-2')).not.toThrow();

    streamService.releaseStream('user', 'history-2');
    jest.useRealTimers();
  });

  it('aborts the active AI request and releases its lock when the conversation is deleted', async () => {
    let aiSignal: AbortSignal | undefined;
    const aiStream = jest.fn((_request: unknown, _token: unknown, _model: unknown, _file: unknown, signal: AbortSignal) => {
      aiSignal = signal;
      return new Promise<string>((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('AI request aborted')));
      });
    });
    const { service, findOwnedChat, streamCancel, streamEnd, streamError, messageRepository } = createService(undefined, aiStream);
    findOwnedChat.mockResolvedValue(Object.assign(new Chat(), { id: 'chat-id' }));
    const streamService = service as unknown as {
      startUserStream: (username: string, historyId: string) => void;
      releaseStream: (username: string, historyId: string) => void;
      processAiStream: (context: {
        username: string;
        prompt: string;
        attachments: Upload[];
        userMessage: ChatMessage;
        text: string;
        botMessage: ChatMessage;
        scope: StreamScope;
        historyId: string;
        selectionMode: SelectionMode;
      }) => Promise<void>;
    };
    const userMessage = Object.assign(new ChatMessage(), {
      id: 'user-message',
      chatId: 'chat-id',
      sequence: 1,
      message: 'سلام',
      bot: false,
      attachments: [],
      createdAt: new Date(),
    });
    const botMessage = Object.assign(new ChatMessage(), {
      id: 'bot-message',
      chatId: 'chat-id',
      sequence: 2,
      message: '',
      bot: true,
      attachments: [],
      createdAt: new Date(),
    });

    streamService.startUserStream('user', 'history-id');
    const processing = streamService.processAiStream({
      username: 'user',
      prompt: 'سلام',
      attachments: [],
      userMessage,
      text: '',
      botMessage,
      scope: StreamScope.GENERAL,
      historyId: 'history-id',
      selectionMode: SelectionMode.GENERAL_CHAT,
    });
    await new Promise((resolve) => setImmediate(resolve));

    await service.remove('history-id', 'user');
    await processing;

    expect(aiSignal?.aborted).toBe(true);
    expect(streamCancel).toHaveBeenCalledWith('user', 'history-id');
    expect(streamError).not.toHaveBeenCalled();
    expect(streamEnd).not.toHaveBeenCalled();
    expect(messageRepository.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-message', attachments: [] }));
    expect(messageRepository.save).not.toHaveBeenCalledWith(expect.objectContaining({ id: 'bot-message' }));
    expect(() => streamService.startUserStream('user', 'next-history-id')).not.toThrow();
    streamService.releaseStream('user', 'next-history-id');
  });

  it('sends the timeout response and releases the stream lock when AI does not respond', async () => {
    jest.useFakeTimers();
    const aiStream = jest.fn(() => new Promise<string>(() => undefined));
    const { service, streamEnd, streamError, messageRepository } = createService(undefined, aiStream, '1');
    const streamService = service as unknown as {
      startUserStream: (username: string, historyId: string) => void;
      processAiStream: (context: {
        username: string;
        prompt: string;
        attachments: Upload[];
        userMessage: ChatMessage;
        text: string;
        botMessage: ChatMessage;
        scope: StreamScope;
        historyId: string;
        selectionMode: SelectionMode;
      }) => Promise<void>;
    };
    const userMessage = Object.assign(new ChatMessage(), {
      id: 'user-message',
      chatId: 'chat-id',
      sequence: 1,
      message: 'سلام',
      bot: false,
      attachments: [],
      createdAt: new Date(),
    });
    const botMessage = Object.assign(new ChatMessage(), {
      id: 'bot-message',
      chatId: 'chat-id',
      sequence: 2,
      message: '',
      bot: true,
      attachments: [],
      createdAt: new Date(),
    });

    streamService.startUserStream('user', 'history-id');
    const processing = streamService.processAiStream({
      username: 'user',
      prompt: 'سلام',
      attachments: [],
      userMessage,
      text: '',
      botMessage,
      scope: StreamScope.GENERAL,
      historyId: 'history-id',
      selectionMode: SelectionMode.GENERAL_CHAT,
    });

    await jest.advanceTimersByTimeAsync(1_000);
    await processing;

    expect(messageRepository.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'bot-message', message: 'دستیار زبانی پاسخ نداد' }));
    expect(streamError).toHaveBeenCalledWith('user', expect.objectContaining({ message: 'دستیار زبانی پاسخ نداد' }));
    expect(streamEnd).toHaveBeenCalledWith('user', expect.objectContaining({ message: 'دستیار زبانی پاسخ نداد' }));
    expect(() => streamService.startUserStream('user', 'next-history-id')).not.toThrow();
    jest.useRealTimers();
  });
});

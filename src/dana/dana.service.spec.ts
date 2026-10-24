import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { AxiosResponse } from 'axios';
import { Readable } from 'node:stream';
import type { LogManager } from '../common/logger/log-manager.service';
import type { PromptService } from '../prompt/prompt.service';
import { Upload } from '../uploads/entities/upload.entity';
import { FileTag } from '../storage/enums/file-tag.enum';
import type { DanaStreamRequest } from './interfaces/dana-stream-request.interface';
import { DanaService } from './dana.service';
import { SelectionMode } from '../stream/enums/selection-mode.enum';

describe('DanaService', () => {
  const failureMock = jest.fn();
  const logger = {
    info: jest.fn(),
    trace: jest.fn(),
    warning: jest.fn(),
    failure: failureMock,
  } as unknown as LogManager;

  const request = (overrides: Partial<DanaStreamRequest> = {}): DanaStreamRequest => ({
    userQuery: 'سلام',
    username: 'user',
    history: [],
    historyCount: 1,
    selectionMode: SelectionMode.GENERAL_CHAT,
    files: [],
    ...overrides,
  });

  const response = (chunks: string[]): AxiosResponse<Readable> =>
    ({
      status: 200,
      data: Readable.from(chunks.map((chunk) => Buffer.from(chunk))),
    }) as AxiosResponse<Readable>;

  const promptService = (prompt?: string) =>
    ({
      findActive: jest.fn().mockResolvedValue(prompt ? { prompt } : null),
    }) as unknown as PromptService;

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('uses detectIntent response as the conversation history name', async () => {
    const postMock = jest.spyOn(axios, 'post').mockResolvedValue({
      status: 200,
      data: { intent: 'گفت‌وگو درباره سلام و احوال‌پرسی' },
    });
    const service = new DanaService(
      new ConfigService({
        AI_DETECT_INTENT_URL: 'http://localhost:5013',
        AI_RESPONSE_START_TIMEOUT_SECONDS: '300',
        AI_MODEL_NAME: 'gemma4:31b',
      }),
      logger,
      promptService('پرامپت فعال کاربر')
    );

    await expect(
      service.detectIntent({
        UserInfo: {
          userQuery: 'سلام',
          username: 'khashayar',
          history: [],
          historyCount: 1,
        },
        ModelConfigs: {
          ModelName: 'gemma4:31b',
          systemPrompt: 'پرامپت فعال کاربر',
          reasoning: false,
          temperature: 0.2,
          maxToken: 60000,
        },
      })
    ).resolves.toBe('گفت‌وگو درباره سلام و احوال‌پرسی');

    expect(postMock).toHaveBeenCalledWith(
      'http://localhost:5013/api/v1/nlpEngine/detectIntent',
      {
        UserInfo: {
          userQuery: 'سلام',
          username: 'khashayar',
          history: [],
          historyCount: 1,
        },
        ModelConfigs: {
          ModelName: 'gemma4:31b',
          systemPrompt: 'پرامپت فعال کاربر',
          reasoning: false,
          temperature: 0.2,
          maxToken: 60000,
        },
      },
      { timeout: 300_000 }
    );
  });

  it('sends the expected NLP engine payload with a Node stream response', async () => {
    const postMock = jest.spyOn(axios, 'post').mockResolvedValue(response(['پاسخ']));
    const service = new DanaService(
      new ConfigService({
        AI_ASSISTANT_URL: 'http://ai.local',
        AI_MODEL_NAME: 'gemma4:31b',
        MINIO_ENDPOINT: 'localhost',
        MINIO_PORT: '9002',
        MINIO_ACCESS_KEY: 'replace-with-a-random-access-key',
        MINIO_SECRET_KEY: 'replace-with-a-long-random-secret-key',
        MINIO_PUBLIC_ENDPOINT: 'localhost',
        MINIO_REGION: 'us-east-1',
      }),
      logger,
      promptService('پرامپت فعال کاربر')
    );
    const file = Object.assign(new Upload(), {
      fileId: 'file-id',
      filename: 'document.pdf',
      originalName: 'document.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      bucket: 'dana-client',
      objectName: 'khashayar/upload-id/document.pdf',
      fullPath: 'minio://dana-client/khashayar/upload-id/document.pdf',
      tag: FileTag.USER,
    });

    await service.stream(
      request({
        username: 'khashayar',
        files: [file],
        text: 'متن اصلی',
        letter_operation: 'rewrite',
        translate: 'fa',
      }),
      jest.fn()
    );

    const [url, body, config] = postMock.mock.calls[0] as unknown as [string, Record<string, unknown>, { responseType: string; timeout: number }];
    expect(url).toBe('http://ai.local/api/v1/nlpEngine/generalChat?stream=on');
    expect(config).toMatchObject({ responseType: 'stream', timeout: 0 });
    expect(body).toEqual({
      request: SelectionMode.GENERAL_CHAT,
      UserInfo: {
        userQuery: 'سلام',
        username: 'khashayar',
        history: [],
        historyCount: 1,
      },
      text: 'متن اصلی',
      letter_operation: 'rewrite',
      translate: 'fa',
      ModelConfigs: {
        ModelName: 'gemma4:31b',
        systemPrompt: 'پرامپت فعال کاربر',
        reasoning: false,
        temperature: 0.2,
        maxToken: 60000,
      },
      MinioConfig: {
        endpoint: 'localhost:9002',
        access_key: 'replace-with-a-random-access-key',
        secret_key: 'replace-with-a-long-random-secret-key',
        bucket: 'dana-client',
        secure: 'false',
        public_endpoint: 'localhost:9002',
        public_secure: 'false',
        region: 'us-east-1',
        object_key: ['khashayar/upload-id/document.pdf'],
      },
    });
  });

  it.each(['', 'default', ' DEFAULT '])('includes uploaded files in MinioConfig when userQuery is %p', async (userQuery) => {
    const postMock = jest.spyOn(axios, 'post').mockResolvedValue(response(['پاسخ']));
    const service = new DanaService(new ConfigService({ AI_ASSISTANT_URL: 'http://ai.local' }), logger, promptService());
    const file = Object.assign(new Upload(), {
      bucket: 'dana-client',
      objectName: 'user/attachments/file-id/document.pdf',
    });

    await service.stream(request({ userQuery, files: [file] }), jest.fn());

    const body = postMock.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(body).toMatchObject({
      MinioConfig: {
        bucket: 'dana-client',
        object_key: ['user/attachments/file-id/document.pdf'],
      },
    });
  });

  it('forwards every Node stream chunk without parsing, resizing, or merging it', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue(response(['سلا', 'م', ' چطو', 'ری']));
    const service = new DanaService(new ConfigService({ AI_ASSISTANT_URL: 'http://ai.local' }), logger, promptService());
    const onToken = jest.fn();

    const answer = await service.stream(request(), onToken);

    expect(onToken.mock.calls).toEqual([['سلا'], ['م'], [' چطو'], ['ری']]);
    expect(answer).toBe('سلام چطوری');
  });

  it('handles a generated file response without forwarding it as stream text', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'application/json' },
      data: Readable.from([
        JSON.stringify({
          status: 'success',
          text: 'فایل آماده است',
          object_key: 'user/generated/report.xlsx',
          bucket: 'generated-files',
          presigned_url: 'https://minio.local/report.xlsx',
        }),
      ]),
    });
    const service = new DanaService(new ConfigService({ AI_ASSISTANT_URL: 'http://ai.local' }), logger, promptService());
    const onToken = jest.fn();
    const onGeneratedFile = jest.fn();

    await expect(service.stream(request(), onToken, undefined, onGeneratedFile)).resolves.toBe('فایل آماده است');
    expect(onToken).not.toHaveBeenCalled();
    expect(onGeneratedFile).toHaveBeenCalledWith({
      text: 'فایل آماده است',
      objectKey: 'user/generated/report.xlsx',
      bucket: 'generated-files',
      presignedUrl: 'https://minio.local/report.xlsx',
    });
  });

  it.each([
    [{ text: 'پاسخ کامل دانا' }, 'پاسخ کامل دانا'],
    [{ answer: 'پاسخ از answer' }, 'پاسخ از answer'],
    [{ data: { response: 'پاسخ تو در تو' } }, 'پاسخ تو در تو'],
  ])('handles a JSON answer and forwards its text once', async (body, expected) => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      data: Readable.from([Buffer.from(JSON.stringify(body))]),
    });
    const service = new DanaService(new ConfigService({ AI_ASSISTANT_URL: 'http://ai.local' }), logger, promptService());
    const onToken = jest.fn();

    await expect(service.stream(request(), onToken)).resolves.toBe(expected);
    expect(onToken).toHaveBeenCalledTimes(1);
    expect(onToken).toHaveBeenCalledWith(expected);
  });

  it.each([
    ['application/json', JSON.stringify({ status: 500, message: 'خطای پردازش فایل در سرویس هوش مصنوعی', success: false })],
    ['text/event-stream', `data: ${JSON.stringify({ status: 500, message: 'خطای مدل هوش مصنوعی', success: false })}\n\n`],
    ['text/event-stream', `event: error\ndata: ${JSON.stringify({ status: 500, message: 'خطای رویداد SSE', success: false })}\n\n`],
  ])('extracts and logs the AI error message from a successful HTTP %s response', async (contentType, body) => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      status: 200,
      headers: { 'content-type': contentType },
      data: Readable.from([body]),
    });
    const service = new DanaService(new ConfigService({ AI_ASSISTANT_URL: 'http://ai.local' }), logger, promptService());
    const expectedMessage = body.includes('رویداد') ? 'خطای رویداد SSE' : contentType === 'application/json' ? 'خطای پردازش فایل در سرویس هوش مصنوعی' : 'خطای مدل هوش مصنوعی';

    await expect(service.stream(request(), jest.fn())).rejects.toThrow(expectedMessage);
    expect(failureMock).toHaveBeenCalledWith(
      DanaService.name,
      'AI stream response failed',
      expect.objectContaining({ message: expectedMessage }),
      expect.objectContaining({
        username: 'user',
        status: 200,
        aiError: expectedMessage,
      })
    );
  });

  it('rejects malformed JSON responses without trying to read the stream twice', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'application/json' },
      data: Readable.from(['not-json']),
    });
    const service = new DanaService(new ConfigService({ AI_ASSISTANT_URL: 'http://ai.local' }), logger, promptService());

    await expect(service.stream(request(), jest.fn())).rejects.toThrow('AI service returned invalid JSON');
  });

  it('preserves whitespace and protocol text in each transport chunk', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue(response(['data:  سلام  \n', 'data:  دنیا! \n']));
    const service = new DanaService(new ConfigService({ AI_ASSISTANT_URL: 'http://ai.local' }), logger, promptService());
    const onToken = jest.fn();

    const answer = await service.stream(request(), onToken);

    expect(onToken.mock.calls).toEqual([['data:  سلام  \n'], ['data:  دنیا! \n']]);
    expect(answer).toBe('data:  سلام  \ndata:  دنیا! \n');
  });

  it('forwards the status and message returned by the AI service', async () => {
    jest.spyOn(axios, 'post').mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 500,
        data: Readable.from([
          Buffer.from(
            JSON.stringify({
              status: 429,
              message: 'سهمیه سرویس هوش مصنوعی تمام شده است',
              success: false,
            })
          ),
        ]),
      },
    });
    const service = new DanaService(new ConfigService({ AI_ASSISTANT_URL: 'http://ai.local' }), logger, promptService());

    await expect(service.stream(request(), jest.fn())).rejects.toMatchObject({
      status: 429,
      message: 'سهمیه سرویس هوش مصنوعی تمام شده است',
    });
    expect(failureMock).toHaveBeenCalledWith(
      DanaService.name,
      'AI stream request failed',
      expect.objectContaining({
        status: 429,
        message: 'سهمیه سرویس هوش مصنوعی تمام شده است',
      }),
      expect.objectContaining({
        username: 'user',
        selectionMode: SelectionMode.GENERAL_CHAT,
        aiError: 'سهمیه سرویس هوش مصنوعی تمام شده است',
      })
    );
  });
});

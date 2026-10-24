import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createHash } from 'crypto';
import type { AxiosResponse } from 'axios';
import type { Readable } from 'node:stream';
import { LogManager } from '../common/logger/log-manager.service';
import { aiHttpException } from '../common/http/external-http-exception';
import { PromptService } from '../prompt/prompt.service';
import { SelectionMode } from '../stream/enums/selection-mode.enum';
import type { DanaAbortSignal } from './interfaces/dana-abort-signal.interface';
import type { DanaJsonResponse } from './interfaces/dana-json-response.interface';
import type { DanaModelConfig, DetectIntentRequest, DetectIntentResponse } from './interfaces/detect-intent-request.interface';
import type { DanaStreamRequest } from './interfaces/dana-stream-request.interface';
import type { GeneratedFileHandler } from './interfaces/generated-file-response.interface';
import type { TokenHandler } from './types/token-handler.type';

@Injectable()
export class DanaService {
  public selectionMode: string = '';
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LogManager,
    private readonly promptService: PromptService
  ) {}

  async detectIntent(request: DetectIntentRequest): Promise<string> {
    const url = this.configService.get<string>('AI_DETECT_INTENT_URL', 'http://127.0.0.1:5000');
    const startedAt = Date.now();

    try {
      const response = await axios.post<DetectIntentResponse>(`${url}/api/v1/nlpEngine/detectIntent`, request, {
        timeout: this.aiResponseTimeoutMs(),
      });
      const historyName = response.data.intent;
      if (typeof historyName !== 'string' || !historyName.trim()) {
        throw new Error('AI service returned an empty history name');
      }
      this.logger.info(DanaService.name, 'AI intent detection completed', {
        durationMs: Date.now() - startedAt,
      });
      return historyName;
    } catch (error) {
      const aiError = (await aiHttpException(error)) ?? error;
      this.logger.failure(DanaService.name, 'AI intent detection failed', aiError, {
        durationMs: Date.now() - startedAt,
        ...(aiError instanceof Error ? { aiError: aiError.message } : {}),
      });
      throw aiError;
    }
  }

  async createModelConfigs(username: string, requestedModelName?: string): Promise<DanaModelConfig> {
    const activePrompt = await this.promptService.findActive(username);
    return {
      ModelName: this.modelName(requestedModelName),
      systemPrompt: activePrompt?.prompt ?? this.configService.get<string>('AI_SYSTEM_PROMPT', ''),
      reasoning: this.configService.get<string>('AI_REASONING', 'false') === 'true',
      temperature: Number(this.configService.get<string>('AI_TEMPERATURE', '0.2')),
      maxToken: Number(this.configService.get<string>('AI_MAX_TOKEN', '60000')),
    };
  }

  async stream(request: DanaStreamRequest, onToken: TokenHandler, requestedModelName?: string, onGeneratedFile?: GeneratedFileHandler, signal?: DanaAbortSignal): Promise<string> {
    const assistantUrl = this.configService.get<string>('AI_ASSISTANT_URL', '127.0.0.1:8000');
    const baseUrl = /^https?:\/\//i.test(assistantUrl) ? assistantUrl : `http://${assistantUrl}`;
    const modelConfigs = await this.createModelConfigs(request.username, requestedModelName);
    const file = request.files[0];
    const startedAt = Date.now();
    this.logger.info(DanaService.name, 'AI stream request started', {
      username: request.username,
      selectionMode: request.selectionMode,
      fileCount: request.files.length,
      historyCount: request.historyCount,
    });
    this.selectionMode = request.selectionMode;
    let response: AxiosResponse<Readable>;
    try {
      const url = new URL(`api/v1/nlpEngine/${request.selectionMode === SelectionMode.OCR ? 'ocr_minio' : request.selectionMode}`, this.withSlash(baseUrl));
      const hashValue = (value: string) => createHash('sha256').update(value).digest('hex');

      const isDevelopment = this.configService.get<string>('NODE_ENV') === 'development';

      const payload = {
        request: request.selectionMode,
        UserInfo: {
          userQuery: request.userQuery || 'default',
          username: request.username,
          history: request.history,
          historyCount: request.historyCount,
        },
        text: request.text ?? '',
        letter_operation: request.letter_operation ?? '',
        translate: request.translate || '',
        ModelConfigs: modelConfigs,
        MinioConfig: {
          endpoint: this.minioEndpoint('MINIO_ENDPOINT'),
          access_key: this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
          secret_key: this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
          bucket: file?.bucket ?? this.configService.get<string>('MINIO_BUCKET', 'dana-client'),
          secure: this.configService.get<string>('MINIO_USE_SSL', 'false'),
          public_endpoint: this.minioEndpoint('MINIO_PUBLIC_ENDPOINT'),
          public_secure: this.configService.get<string>('MINIO_PUBLIC_USE_SSL', this.configService.get<string>('MINIO_USE_SSL', 'false')),
          region: this.configService.get<string>('MINIO_REGION', 'us-east-1'),
          object_key: request.files.flatMap((item) => (item.objectName ? [item.objectName] : [])),
        },
      };

      const logPayload = {
        ...payload,
        MinioConfig: {
          ...payload.MinioConfig,
          endpoint: isDevelopment ? payload.MinioConfig.endpoint : hashValue(payload.MinioConfig.endpoint),
          access_key: isDevelopment ? payload.MinioConfig.access_key : hashValue(payload.MinioConfig.access_key),
          secret_key: isDevelopment ? payload.MinioConfig.secret_key : hashValue(payload.MinioConfig.secret_key),
        },
      };
      console.log('payload', logPayload);

      this.logger.info(DanaService.name, 'AI stream payload prepared', {
        username: request.username,
        selectionMode: request.selectionMode,
        fileCount: payload.MinioConfig.object_key.length,
        minio: logPayload.MinioConfig,
      });
      url.searchParams.set('stream', 'on');

      const requestConfig = {
        responseType: 'stream' as const,
        headers: {
          accept: 'text/event-stream',
          'content-type': 'application/json',
        },
        timeout: this.aiResponseTimeoutMs(),
        ...(signal ? { signal } : {}),
      };

      response = await axios.post<Readable>(url.href, payload, requestConfig);
    } catch (error) {
      console.log(error);
      const aiError = (await aiHttpException(error)) ?? error;
      this.logger.failure(DanaService.name, 'AI stream request failed', aiError, {
        username: request.username,
        selectionMode: request.selectionMode,
        durationMs: Date.now() - startedAt,
        ...(aiError instanceof Error ? { aiError: aiError.message } : {}),
      });
      throw aiError;
    }

    try {
      return await this.consumeStreamResponse(response, request, onToken, onGeneratedFile, startedAt);
    } catch (error) {
      this.logger.failure(DanaService.name, 'AI stream response failed', error, {
        username: request.username,
        selectionMode: request.selectionMode,
        status: response.status,
        durationMs: Date.now() - startedAt,
        ...(error instanceof Error ? { aiError: error.message } : {}),
      });
      throw error;
    }
  }

  private async consumeStreamResponse(
    response: AxiosResponse<Readable>,
    request: DanaStreamRequest,
    onToken: TokenHandler,
    onGeneratedFile: GeneratedFileHandler | undefined,
    startedAt: number
  ): Promise<string> {
    if (response.status < 200 || response.status >= 300 || !response.data) {
      throw new Error(`AI service returned ${response.status}`);
    }

    let chunkIndex = 0;
    const logAndForwardToken: TokenHandler = (token) => {
      this.logger.trace(DanaService.name, 'AI stream chunk received', {
        username: request.username,
        chunkIndex: ++chunkIndex,
        chunkLength: token.length,
        chunk: token,
      });
      onToken(token);
    };

    if (this.isJsonResponse(response.headers?.['content-type'])) {
      const jsonResponse = await this.readJsonResponse(response.data);
      if (jsonResponse.error) {
        throw new Error(jsonResponse.error);
      }
      if (jsonResponse.generatedFile) {
        await onGeneratedFile?.(jsonResponse.generatedFile);
        this.logCompleted(request, jsonResponse.generatedFile.text, startedAt);
        return jsonResponse.generatedFile.text;
      }

      const answer = jsonResponse.answer ?? '';
      if (!answer.trim()) {
        throw new Error('AI service returned an empty JSON answer');
      }
      logAndForwardToken(answer);
      this.logCompleted(request, answer, startedAt);
      return answer;
    }

    const answer = await this.readStream(response.data, logAndForwardToken);
    const streamError = this.streamErrorMessage(answer);
    if (streamError) {
      throw new Error(streamError);
    }
    if (!answer.trim()) {
      throw new Error('AI service returned an empty answer');
    }
    this.logCompleted(request, answer, startedAt);
    return answer;
  }

  /**
   * Axios uses 0 to disable its request timeout. The value is expressed in
   * seconds so it is consistent with the other AI timeout configuration.
   */
  private aiResponseTimeoutMs(): number {
    const seconds = Number(this.configService.get<string>('AI_RESPONSE_START_TIMEOUT_SECONDS', '0'));
    return Number.isFinite(seconds) && seconds > 0 ? seconds * 1_000 : 0;
  }

  private async readStream(stream: Readable, onToken: TokenHandler): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const decoder = new TextDecoder('utf-8');
      let answer = '';
      let aiMessage = '';

      stream.on('data', (chunk: Buffer | string) => {
        try {
          aiMessage += chunk.toString();

          console.log({
            aiMessage,
            SelectionMode: this.selectionMode,
          });
          const decoded = typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
          answer += decoded;
          onToken(decoded);
        } catch (error) {
          stream.destroy();
          reject(error instanceof Error ? error : new Error('AI stream token handler failed'));
        }
      });
      stream.once('end', () => {
        try {
          const remaining = decoder.decode();
          if (remaining) {
            answer += remaining;
            onToken(remaining);
          }
          resolve(answer);
        } catch (error) {
          reject(error instanceof Error ? error : new Error('AI stream token handler failed'));
        }
      });
      stream.once('error', (error: Error) => reject(error));
    });
  }

  private async readJsonResponse(stream: Readable): Promise<DanaJsonResponse> {
    const decoder = new TextDecoder('utf-8');
    let body = '';
    for await (const chunk of stream as AsyncIterable<unknown>) {
      if (typeof chunk === 'string') {
        body += chunk;
      } else if (chunk instanceof Uint8Array) {
        body += decoder.decode(chunk, { stream: true });
      } else {
        throw new Error('AI service returned an unsupported JSON response chunk');
      }
    }
    body += decoder.decode();

    try {
      const response: unknown = JSON.parse(body);
      if (typeof response === 'string') {
        return { answer: response };
      }
      if (!this.isObject(response)) {
        return {};
      }
      const error = this.jsonError(response);
      if (error) {
        return { error };
      }
      const objectKey = response['object_key'];
      const bucket = response['bucket'];
      const presignedUrl = response['presigned_url'];
      const text = response['text'];
      if (typeof objectKey === 'string' && typeof bucket === 'string' && typeof presignedUrl === 'string') {
        return {
          generatedFile: {
            objectKey,
            bucket,
            presignedUrl,
            text: typeof text === 'string' ? text : '',
          },
        };
      }

      return { answer: this.jsonAnswer(response) };
    } catch {
      throw new Error('AI service returned invalid JSON');
    }
  }

  private jsonAnswer(response: Record<string, unknown>): string | undefined {
    for (const key of ['answer', 'text', 'response', 'message', 'result', 'content']) {
      const value = response[key];
      if (typeof value === 'string') {
        return value;
      }
    }

    const data = response['data'];
    return this.isObject(data) ? this.jsonAnswer(data) : undefined;
  }

  private jsonError(response: Record<string, unknown>): string | undefined {
    if (response['success'] === false) {
      const status = response['status'];
      const message = response['message'];
      return typeof status === 'number' && Number.isInteger(status) && status >= 400 && status <= 599 && typeof message === 'string' && message.trim()
        ? message.trim()
        : 'AI service returned an invalid error response';
    }

    const status = response['status'] ?? response['statusCode'] ?? response['status_code'];
    const failedStatus = typeof status === 'string' && ['error', 'failed', 'failure'].includes(status.trim().toLowerCase());
    const numericStatus = Number(status);
    const failed = failedStatus || (Number.isFinite(numericStatus) && numericStatus >= 400) || 'error' in response || 'detail' in response;
    if (failed) {
      return 'AI service returned an invalid error response';
    }

    const data = response['data'];
    return this.isObject(data) ? this.jsonError(data) : undefined;
  }

  private streamErrorMessage(answer: string): string | undefined {
    const lines = answer.split(/\r?\n/).map((line) => line.trim());
    for (let index = 0; index < lines.length; index += 1) {
      if (!/^event:\s*error$/i.test(lines[index] ?? '')) continue;

      const dataLine = lines.slice(index + 1).find((line) => /^data:/i.test(line));
      const data = dataLine?.replace(/^data:\s*/i, '').trim();
      if (!data) continue;
      try {
        const value: unknown = JSON.parse(data);
        if (this.isObject(value)) {
          return this.jsonError(value) ?? 'AI service returned an invalid error response';
        }
      } catch {
        return 'AI service returned an invalid error response';
      }
    }

    const candidates = [answer.trim(), ...lines.map((line) => line.replace(/^data:\s*/i, '').trim())].filter(Boolean);
    for (const candidate of candidates) {
      try {
        const value: unknown = JSON.parse(candidate);
        if (this.isObject(value)) {
          const error = this.jsonError(value);
          if (error) return error;
        }
      } catch {
        continue;
      }
    }
    return undefined;
  }

  private isJsonResponse(contentType: unknown): boolean {
    return typeof contentType === 'string' && contentType.includes('application/json');
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private withSlash(value: string): string {
    return value.endsWith('/') ? value : `${value}/`;
  }

  // private shouldIncludeMinioConfig(userQuery: string): boolean {
  //   const query = userQuery.trim().toLowerCase();
  //   return Boolean(query) && query !== 'default';
  // }

  // private minioConfig(files: DanaStreamRequest['files'], bucket?: string): Record<string, string | string[]> {
  //   return {
  //     endpoint: this.minioEndpoint('MINIO_ENDPOINT'),
  //     access_key: this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
  //     secret_key: this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
  //     bucket: bucket ?? this.configService.get<string>('MINIO_BUCKET', 'dana-client'),
  //     secure: this.configService.get<string>('MINIO_USE_SSL', 'false'),
  //     public_endpoint: this.minioEndpoint('MINIO_PUBLIC_ENDPOINT'),
  //     public_secure: this.configService.get<string>('MINIO_PUBLIC_USE_SSL', this.configService.get<string>('MINIO_USE_SSL', 'false')),
  //     region: this.configService.get<string>('MINIO_REGION', 'us-east-1'),
  //     object_key: files.flatMap((item) => (item.objectName ? [item.objectName] : [])),
  //   };
  // }

  private modelName(requestedModelName?: string): string {
    if (requestedModelName?.trim()) {
      return requestedModelName;
    }
    return this.configService.get<string>('AI_MODEL_NAME', 'gemma4:31b');
  }

  private minioEndpoint(endpointKey: 'MINIO_ENDPOINT' | 'MINIO_PUBLIC_ENDPOINT'): string {
    const endpoint = this.configService.get<string>(endpointKey, this.configService.get<string>('MINIO_ENDPOINT', 'localhost'));
    const port = this.configService.get<string>('MINIO_PORT', '9002');
    return endpoint.includes(':') ? endpoint : `${endpoint}:${port}`;
  }

  private logCompleted(request: DanaStreamRequest, answer: string, startedAt: number): void {
    this.logger.info(DanaService.name, 'AI stream request completed', {
      username: request.username,
      selectionMode: request.selectionMode,
      fileCount: request.files.length,
      answerLength: answer.length,
      durationMs: Date.now() - startedAt,
    });
  }
}

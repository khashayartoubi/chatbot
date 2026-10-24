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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var DanaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DanaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
const log_manager_service_1 = require("../common/logger/log-manager.service");
const external_http_exception_1 = require("../common/http/external-http-exception");
const prompt_service_1 = require("../prompt/prompt.service");
const selection_mode_enum_1 = require("../stream/enums/selection-mode.enum");
let DanaService = DanaService_1 = class DanaService {
    configService;
    logger;
    promptService;
    selectionMode = '';
    constructor(configService, logger, promptService) {
        this.configService = configService;
        this.logger = logger;
        this.promptService = promptService;
    }
    async detectIntent(request) {
        const url = this.configService.get('AI_DETECT_INTENT_URL', 'http://127.0.0.1:5000');
        const startedAt = Date.now();
        try {
            const response = await axios_1.default.post(`${url}/api/v1/nlpEngine/detectIntent`, request, {
                timeout: this.aiResponseTimeoutMs(),
            });
            const historyName = response.data.intent;
            if (typeof historyName !== 'string' || !historyName.trim()) {
                throw new Error('AI service returned an empty history name');
            }
            this.logger.info(DanaService_1.name, 'AI intent detection completed', {
                durationMs: Date.now() - startedAt,
            });
            return historyName;
        }
        catch (error) {
            const aiError = (await (0, external_http_exception_1.aiHttpException)(error)) ?? error;
            this.logger.failure(DanaService_1.name, 'AI intent detection failed', aiError, {
                durationMs: Date.now() - startedAt,
                ...(aiError instanceof Error ? { aiError: aiError.message } : {}),
            });
            throw aiError;
        }
    }
    async createModelConfigs(username, requestedModelName) {
        const activePrompt = await this.promptService.findActive(username);
        return {
            ModelName: this.modelName(requestedModelName),
            systemPrompt: activePrompt?.prompt ?? this.configService.get('AI_SYSTEM_PROMPT', ''),
            reasoning: this.configService.get('AI_REASONING', 'false') === 'true',
            temperature: Number(this.configService.get('AI_TEMPERATURE', '0.2')),
            maxToken: Number(this.configService.get('AI_MAX_TOKEN', '60000')),
        };
    }
    async stream(request, onToken, requestedModelName, onGeneratedFile, signal) {
        const assistantUrl = this.configService.get('AI_ASSISTANT_URL', '127.0.0.1:8000');
        const baseUrl = /^https?:\/\//i.test(assistantUrl) ? assistantUrl : `http://${assistantUrl}`;
        const modelConfigs = await this.createModelConfigs(request.username, requestedModelName);
        const file = request.files[0];
        const startedAt = Date.now();
        this.logger.info(DanaService_1.name, 'AI stream request started', {
            username: request.username,
            selectionMode: request.selectionMode,
            fileCount: request.files.length,
            historyCount: request.historyCount,
        });
        this.selectionMode = request.selectionMode;
        let response;
        try {
            const url = new URL(`api/v1/nlpEngine/${request.selectionMode === selection_mode_enum_1.SelectionMode.OCR ? 'ocr_minio' : request.selectionMode}`, this.withSlash(baseUrl));
            const hashValue = (value) => (0, crypto_1.createHash)('sha256').update(value).digest('hex');
            const isDevelopment = this.configService.get('NODE_ENV') === 'development';
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
                    access_key: this.configService.get('MINIO_ACCESS_KEY', 'minioadmin'),
                    secret_key: this.configService.get('MINIO_SECRET_KEY', 'minioadmin'),
                    bucket: file?.bucket ?? this.configService.get('MINIO_BUCKET', 'dana-client'),
                    secure: this.configService.get('MINIO_USE_SSL', 'false'),
                    public_endpoint: this.minioEndpoint('MINIO_PUBLIC_ENDPOINT'),
                    public_secure: this.configService.get('MINIO_PUBLIC_USE_SSL', this.configService.get('MINIO_USE_SSL', 'false')),
                    region: this.configService.get('MINIO_REGION', 'us-east-1'),
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
            this.logger.info(DanaService_1.name, 'AI stream payload prepared', {
                username: request.username,
                selectionMode: request.selectionMode,
                fileCount: payload.MinioConfig.object_key.length,
                minio: logPayload.MinioConfig,
            });
            url.searchParams.set('stream', 'on');
            const requestConfig = {
                responseType: 'stream',
                headers: {
                    accept: 'text/event-stream',
                    'content-type': 'application/json',
                },
                timeout: this.aiResponseTimeoutMs(),
                ...(signal ? { signal } : {}),
            };
            response = await axios_1.default.post(url.href, payload, requestConfig);
        }
        catch (error) {
            console.log(error);
            const aiError = (await (0, external_http_exception_1.aiHttpException)(error)) ?? error;
            this.logger.failure(DanaService_1.name, 'AI stream request failed', aiError, {
                username: request.username,
                selectionMode: request.selectionMode,
                durationMs: Date.now() - startedAt,
                ...(aiError instanceof Error ? { aiError: aiError.message } : {}),
            });
            throw aiError;
        }
        try {
            return await this.consumeStreamResponse(response, request, onToken, onGeneratedFile, startedAt);
        }
        catch (error) {
            this.logger.failure(DanaService_1.name, 'AI stream response failed', error, {
                username: request.username,
                selectionMode: request.selectionMode,
                status: response.status,
                durationMs: Date.now() - startedAt,
                ...(error instanceof Error ? { aiError: error.message } : {}),
            });
            throw error;
        }
    }
    async consumeStreamResponse(response, request, onToken, onGeneratedFile, startedAt) {
        if (response.status < 200 || response.status >= 300 || !response.data) {
            throw new Error(`AI service returned ${response.status}`);
        }
        let chunkIndex = 0;
        const logAndForwardToken = (token) => {
            this.logger.trace(DanaService_1.name, 'AI stream chunk received', {
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
    aiResponseTimeoutMs() {
        const seconds = Number(this.configService.get('AI_RESPONSE_START_TIMEOUT_SECONDS', '0'));
        return Number.isFinite(seconds) && seconds > 0 ? seconds * 1_000 : 0;
    }
    async readStream(stream, onToken) {
        return new Promise((resolve, reject) => {
            const decoder = new TextDecoder('utf-8');
            let answer = '';
            let aiMessage = '';
            stream.on('data', (chunk) => {
                try {
                    aiMessage += chunk.toString();
                    console.log({
                        aiMessage,
                        SelectionMode: this.selectionMode,
                    });
                    const decoded = typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
                    answer += decoded;
                    onToken(decoded);
                }
                catch (error) {
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
                }
                catch (error) {
                    reject(error instanceof Error ? error : new Error('AI stream token handler failed'));
                }
            });
            stream.once('error', (error) => reject(error));
        });
    }
    async readJsonResponse(stream) {
        const decoder = new TextDecoder('utf-8');
        let body = '';
        for await (const chunk of stream) {
            if (typeof chunk === 'string') {
                body += chunk;
            }
            else if (chunk instanceof Uint8Array) {
                body += decoder.decode(chunk, { stream: true });
            }
            else {
                throw new Error('AI service returned an unsupported JSON response chunk');
            }
        }
        body += decoder.decode();
        try {
            const response = JSON.parse(body);
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
        }
        catch {
            throw new Error('AI service returned invalid JSON');
        }
    }
    jsonAnswer(response) {
        for (const key of ['answer', 'text', 'response', 'message', 'result', 'content']) {
            const value = response[key];
            if (typeof value === 'string') {
                return value;
            }
        }
        const data = response['data'];
        return this.isObject(data) ? this.jsonAnswer(data) : undefined;
    }
    jsonError(response) {
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
    streamErrorMessage(answer) {
        const lines = answer.split(/\r?\n/).map((line) => line.trim());
        for (let index = 0; index < lines.length; index += 1) {
            if (!/^event:\s*error$/i.test(lines[index] ?? ''))
                continue;
            const dataLine = lines.slice(index + 1).find((line) => /^data:/i.test(line));
            const data = dataLine?.replace(/^data:\s*/i, '').trim();
            if (!data)
                continue;
            try {
                const value = JSON.parse(data);
                if (this.isObject(value)) {
                    return this.jsonError(value) ?? 'AI service returned an invalid error response';
                }
            }
            catch {
                return 'AI service returned an invalid error response';
            }
        }
        const candidates = [answer.trim(), ...lines.map((line) => line.replace(/^data:\s*/i, '').trim())].filter(Boolean);
        for (const candidate of candidates) {
            try {
                const value = JSON.parse(candidate);
                if (this.isObject(value)) {
                    const error = this.jsonError(value);
                    if (error)
                        return error;
                }
            }
            catch {
                continue;
            }
        }
        return undefined;
    }
    isJsonResponse(contentType) {
        return typeof contentType === 'string' && contentType.includes('application/json');
    }
    isObject(value) {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }
    withSlash(value) {
        return value.endsWith('/') ? value : `${value}/`;
    }
    modelName(requestedModelName) {
        if (requestedModelName?.trim()) {
            return requestedModelName;
        }
        return this.configService.get('AI_MODEL_NAME', 'gemma4:31b');
    }
    minioEndpoint(endpointKey) {
        const endpoint = this.configService.get(endpointKey, this.configService.get('MINIO_ENDPOINT', 'localhost'));
        const port = this.configService.get('MINIO_PORT', '9002');
        return endpoint.includes(':') ? endpoint : `${endpoint}:${port}`;
    }
    logCompleted(request, answer, startedAt) {
        this.logger.info(DanaService_1.name, 'AI stream request completed', {
            username: request.username,
            selectionMode: request.selectionMode,
            fileCount: request.files.length,
            answerLength: answer.length,
            durationMs: Date.now() - startedAt,
        });
    }
};
exports.DanaService = DanaService;
exports.DanaService = DanaService = DanaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        log_manager_service_1.LogManager,
        prompt_service_1.PromptService])
], DanaService);
//# sourceMappingURL=dana.service.js.map
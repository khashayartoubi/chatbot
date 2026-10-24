"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.externalHttpException = externalHttpException;
exports.aiHttpException = aiHttpException;
exports.httpExceptionMessage = httpExceptionMessage;
exports.isServiceUnavailableError = isServiceUnavailableError;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const node_stream_1 = require("node:stream");
const app_http_exception_1 = require("../../error/exceptions/app-http.exception");
async function externalHttpException(error) {
    if (!axios_1.default.isAxiosError(error) || !error.response) {
        return undefined;
    }
    const responseBody = await readBody(error.response.data);
    const body = errorBody(responseBody);
    const message = errorMessage(body?.['message'] ?? responseBody);
    if (!message) {
        return undefined;
    }
    const status = errorStatus(body?.['status'] ?? body?.['statusCode']) ?? error.response.status;
    return new app_http_exception_1.AppHttpException(message, status);
}
async function aiHttpException(error) {
    if (!axios_1.default.isAxiosError(error) || !error.response) {
        return undefined;
    }
    const responseBody = await readBody(error.response.data);
    if (!isAiErrorBody(responseBody)) {
        return undefined;
    }
    return new app_http_exception_1.AppHttpException(responseBody.message.trim(), responseBody.status);
}
function httpExceptionMessage(error) {
    if (!(error instanceof common_1.HttpException)) {
        return undefined;
    }
    const response = error.getResponse();
    const message = errorMessage(errorBody(response)?.['message'] ?? response);
    return Array.isArray(message) ? message.join(', ') : message;
}
function isServiceUnavailableError(error) {
    if (!axios_1.default.isAxiosError(error) || error.response) {
        return false;
    }
    return ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EHOSTUNREACH', 'ENETUNREACH', 'ENOTFOUND', 'EAI_AGAIN', 'ERR_NETWORK'].includes(error.code ?? '');
}
function errorBody(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return undefined;
    }
    const body = value;
    const nested = body['error'];
    return nested && typeof nested === 'object' && !Array.isArray(nested) ? nested : body;
}
function errorMessage(value) {
    if (typeof value === 'string') {
        return value.trim() || undefined;
    }
    if (!Array.isArray(value)) {
        return undefined;
    }
    const messages = value.filter((item) => typeof item === 'string' && Boolean(item.trim()));
    return messages.length ? messages : undefined;
}
function errorStatus(value) {
    const status = Number(value);
    return Number.isInteger(status) && status >= 400 && status <= 599 ? status : undefined;
}
function isAiErrorBody(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }
    const body = value;
    return (body['success'] === false &&
        typeof body['status'] === 'number' &&
        Number.isInteger(body['status']) &&
        body['status'] >= 400 &&
        body['status'] <= 599 &&
        typeof body['message'] === 'string' &&
        Boolean(body['message'].trim()));
}
async function readBody(value) {
    if (value instanceof node_stream_1.Readable) {
        const chunks = [];
        for await (const chunk of value) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return parse(Buffer.concat(chunks).toString('utf8'));
    }
    if (value instanceof ArrayBuffer) {
        return parse(Buffer.from(value).toString('utf8'));
    }
    if (ArrayBuffer.isView(value)) {
        return parse(Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString('utf8'));
    }
    return typeof value === 'string' ? parse(value) : value;
}
function parse(value) {
    try {
        return JSON.parse(value);
    }
    catch {
        return value;
    }
}
//# sourceMappingURL=external-http-exception.js.map
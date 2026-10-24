import { HttpException } from '@nestjs/common';
import axios from 'axios';
import { Readable } from 'node:stream';
import { AppHttpException } from '../../error/exceptions/app-http.exception';

type ErrorBody = Record<string, unknown>;

export async function externalHttpException(error: unknown): Promise<HttpException | undefined> {
  if (!axios.isAxiosError(error) || !error.response) {
    return undefined;
  }

  const responseBody = await readBody(error.response.data);
  const body = errorBody(responseBody);
  const message = errorMessage(body?.['message'] ?? responseBody);

  if (!message) {
    return undefined;
  }

  const status = errorStatus(body?.['status'] ?? body?.['statusCode']) ?? error.response.status;
  return new AppHttpException(message, status);
}

/** Only exposes an AI error message when it matches the AI error contract. */
export async function aiHttpException(error: unknown): Promise<HttpException | undefined> {
  if (!axios.isAxiosError(error) || !error.response) {
    return undefined;
  }

  const responseBody = await readBody(error.response.data);
  if (!isAiErrorBody(responseBody)) {
    return undefined;
  }

  return new AppHttpException(responseBody.message.trim(), responseBody.status);
}

export function httpExceptionMessage(error: unknown): string | undefined {
  if (!(error instanceof HttpException)) {
    return undefined;
  }

  const response = error.getResponse();
  const message = errorMessage(errorBody(response)?.['message'] ?? response);
  return Array.isArray(message) ? message.join(', ') : message;
}

/** True when the AI endpoint could not be reached and did not return a response. */
export function isServiceUnavailableError(error: unknown): boolean {
  if (!axios.isAxiosError(error) || error.response) {
    return false;
  }

  return ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EHOSTUNREACH', 'ENETUNREACH', 'ENOTFOUND', 'EAI_AGAIN', 'ERR_NETWORK'].includes(error.code ?? '');
}

function errorBody(value: unknown): ErrorBody | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const body = value as ErrorBody;
  const nested = body['error'];
  return nested && typeof nested === 'object' && !Array.isArray(nested) ? (nested as ErrorBody) : body;
}

function errorMessage(value: unknown): string | string[] | undefined {
  if (typeof value === 'string') {
    return value.trim() || undefined;
  }
  if (!Array.isArray(value)) {
    return undefined;
  }

  const messages = value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()));
  return messages.length ? messages : undefined;
}

function errorStatus(value: unknown): number | undefined {
  const status = Number(value);
  return Number.isInteger(status) && status >= 400 && status <= 599 ? status : undefined;
}

function isAiErrorBody(value: unknown): value is { status: number; message: string; success: false } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const body = value as ErrorBody;
  return (
    body['success'] === false &&
    typeof body['status'] === 'number' &&
    Number.isInteger(body['status']) &&
    body['status'] >= 400 &&
    body['status'] <= 599 &&
    typeof body['message'] === 'string' &&
    Boolean(body['message'].trim())
  );
}

async function readBody(value: unknown): Promise<unknown> {
  if (value instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of value as AsyncIterable<Buffer | string>) {
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

function parse(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

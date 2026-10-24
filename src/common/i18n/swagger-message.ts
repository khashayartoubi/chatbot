import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type TranslationTree = Record<string, unknown>;

const language = process.env['SWAGGER_LANGUAGE'] === 'en' ? 'en' : 'fa';
const translations = JSON.parse(readFileSync(join(__dirname, '..', '..', 'i18n', language, 'messages.json'), 'utf8')) as TranslationTree;

export function swaggerMessage(key: string): string {
  let value: unknown = translations;
  for (const part of key.split('.')) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return key;
    }
    value = (value as TranslationTree)[part];
  }
  return typeof value === 'string' ? value : key;
}

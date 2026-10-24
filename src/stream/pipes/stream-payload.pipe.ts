import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { I18nMessageService } from '../../common/i18n/i18n-message.service';
import { StreamMessageDto } from '../dto/stream-message.dto';

@Injectable()
export class StreamPayloadPipe implements PipeTransform<unknown, Promise<StreamMessageDto>> {
  constructor(private readonly messages: I18nMessageService) {}

  async transform(value: unknown): Promise<StreamMessageDto> {
    const source = this.isObject(value) && 'payload' in value ? value['payload'] : value;
    const payload = this.parse(source);
    const messageSchema = payload['messageSchema'];

    if (typeof payload['letterOperation'] === 'string' && typeof payload['letter_operation'] !== 'string') {
      payload['letter_operation'] = payload['letterOperation'];
    }

    if (this.isObject(messageSchema) && !this.isObject(messageSchema['message'])) {
      payload['messageSchema'] = { message: { ...messageSchema } };
    }

    const dto = plainToInstance(StreamMessageDto, payload);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });

    if (errors.length) {
      throw new BadRequestException(this.messages.translate('payload.invalid'));
    }

    return dto;
  }

  private parse(value: unknown): Record<string, unknown> {
    if (this.isObject(value)) {
      return { ...value };
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(this.messages.translate('payload.required'));
    }

    try {
      const parsed: unknown = JSON.parse(value);
      if (!this.isObject(parsed)) {
        throw new Error();
      }
      return parsed;
    } catch {
      throw new BadRequestException(this.messages.translate('payload.invalidJson'));
    }
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}

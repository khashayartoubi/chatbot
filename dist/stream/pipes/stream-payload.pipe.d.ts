import { PipeTransform } from '@nestjs/common';
import { I18nMessageService } from '../../common/i18n/i18n-message.service';
import { StreamMessageDto } from '../dto/stream-message.dto';
export declare class StreamPayloadPipe implements PipeTransform<unknown, Promise<StreamMessageDto>> {
    private readonly messages;
    constructor(messages: I18nMessageService);
    transform(value: unknown): Promise<StreamMessageDto>;
    private parse;
    private isObject;
}

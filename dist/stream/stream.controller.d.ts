import { HttpStatus } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { StreamService } from './stream.service';
export declare class StreamController {
    private readonly streamService;
    private readonly messages;
    constructor(streamService: StreamService, messages: I18nMessageService);
    stream(files: Express.Multer.File[], payload: unknown, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: {
            historyId: string;
            chatId: string;
            messageId: string;
            answerStatus: import("./enums/answer-status.enum").AnswerStatus;
        } | undefined;
    }>;
}

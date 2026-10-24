import { HttpStatus } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { PinSessionDto } from './dto/pin-session.dto';
import { PinService } from './pin.service';
export declare class PinController {
    private readonly pinService;
    private readonly messages;
    constructor(pinService: PinService, messages: I18nMessageService);
    pin(dto: PinSessionDto, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: import("./interfaces/pin-result.interface").PinResult;
    }>;
}

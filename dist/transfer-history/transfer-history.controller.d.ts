import { HttpStatus } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { TransferHistoryDto } from './dto/transfer-history.dto';
import { TransferHistoryService } from './transfer-history.service';
export declare class TransferHistoryController {
    private readonly transferHistoryService;
    private readonly messages;
    constructor(transferHistoryService: TransferHistoryService, messages: I18nMessageService);
    transfer(dto: TransferHistoryDto, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: {
            historyId: string;
            sourceCollectionId: string;
            targetCollectionId: string;
            target: "general" | "project";
        };
    }>;
}

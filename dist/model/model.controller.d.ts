import { HttpStatus } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { ModelService } from './model.service';
import { SetModelDto } from './dto/set-model.dto';
export declare class ModelController {
    private readonly modelService;
    private readonly messages;
    constructor(modelService: ModelService, messages: I18nMessageService);
    getModel(): Promise<{
        success: boolean;
        status: number;
        message: string;
        data: import("./interfaces/model.interface").Model[];
    }>;
    setModel(dto: SetModelDto, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: {
            updatedCount: number;
        };
    }>;
}

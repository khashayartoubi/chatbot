import { HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { BackgroundService } from './background.service';
import { UpdateBackgroundDto } from './dto/update-background.dto';
export declare class BackgroundController {
    private readonly backgroundService;
    private readonly messages;
    constructor(backgroundService: BackgroundService, messages: I18nMessageService);
    get(request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: import("./entities/background.entity").Background;
    }>;
    update(dto: UpdateBackgroundDto, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: import("./entities/background.entity").Background;
    }>;
    uploadImage(file: Express.Multer.File, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: import("./entities/background.entity").Background;
    }>;
    preview(request: AuthenticatedRequest, response: Response): Promise<void>;
}

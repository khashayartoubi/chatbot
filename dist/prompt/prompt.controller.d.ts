import { HttpStatus } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { PromptService } from './prompt.service';
export declare class PromptController {
    private readonly promptService;
    private readonly messages;
    constructor(promptService: PromptService, messages: I18nMessageService);
    create(dto: CreatePromptDto, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: import("./entities/prompt.entity").Prompt;
    }>;
    findAll(request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: import("./entities/prompt.entity").Prompt[];
    }>;
    findOne(promptId: string, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: import("./entities/prompt.entity").Prompt;
    }>;
    update(promptId: string, dto: UpdatePromptDto, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: import("./entities/prompt.entity").Prompt;
    }>;
    remove(promptId: string, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: never[];
    }>;
}

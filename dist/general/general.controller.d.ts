import { HttpStatus } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { UpdateUserMessageDto } from '../stream/dto/update-user-message.dto';
import { EditGeneralSessionDto } from './dto/edit-general-session.dto';
import { GeneralService } from './general.service';
export declare class GeneralController {
    private readonly generalService;
    private readonly messages;
    constructor(generalService: GeneralService, messages: I18nMessageService);
    getHistory(pagination: PaginationQueryDto, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: import("./entities/general-history.entity").GeneralHistory[];
    }>;
    getMessages(historyId: string, pagination: PaginationQueryDto, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: {
            id: string;
            unread: boolean;
            type: string;
            selectionMode: import("../stream/enums/selection-mode.enum").SelectionMode | undefined;
            messageType: import("../stream/enums/selection-mode.enum").SelectionMode | undefined;
            message: string;
            bot: boolean;
            answerStatus: import("../stream/enums/answer-status.enum").AnswerStatus;
            avatar: string;
            attachments: unknown[];
            liked: boolean;
            disLiked: boolean;
            starred: boolean;
            delivered: boolean;
            createdAt: {
                $date: string;
            };
            comment: string;
            translate: string[];
            reply: unknown[];
        }[];
    }>;
    getHistoryFiles(historyId: string, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: import("./entities/general-file.entity").GeneralFile[];
    }>;
    editSession(dto: EditGeneralSessionDto, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: import("../stream/entities/chat.entity").Chat;
    }>;
    updateMessage(dto: UpdateUserMessageDto, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: {
            historyId: string;
            messageId: string;
        };
    }>;
    remove(historyId: string, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: never[];
    }>;
    removeAll(request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: {
            deletedCount: number;
        };
    }>;
}

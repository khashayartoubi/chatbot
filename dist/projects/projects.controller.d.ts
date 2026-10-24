import { HttpStatus } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { EditSessionDto } from '../stream/dto/edit-session.dto';
import { UpdateProjectUserMessageDto } from '../stream/dto/update-user-message.dto';
import { StreamService } from '../stream/stream.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';
export declare class ProjectsController {
    private readonly projectsService;
    private readonly streamService;
    private readonly messages;
    constructor(projectsService: ProjectsService, streamService: StreamService, messages: I18nMessageService);
    create(dto: CreateProjectDto, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: {
            collectionId: string;
            collectionName: string;
            collectionGraph: {};
            collectionHistory: never[];
            createdAt: Date;
            prompt: string;
            state: string;
            waiting: boolean;
        };
    }>;
    findAll(pagination: PaginationQueryDto, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: import("./entities/project.entity").Project[];
    }>;
    getCollection(pagination: PaginationQueryDto, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: {
            user_name: string;
            state: string;
            collections: {
                collectionId: string;
                collectionName: string;
                color: string;
                icon: string;
                pinned: boolean;
                collectionGraph: {};
                collectionHistory: {
                    historyCount: number;
                    historyName: string;
                    historyType: string;
                    isActive: boolean;
                    pinned: boolean;
                    modelName: string;
                    prompt: string;
                    reasoning: boolean;
                    state: string;
                    translate: string[];
                    waiting: boolean;
                    answerStatus: import("../stream/enums/answer-status.enum").AnswerStatus;
                    files: string[];
                    createdAt: Date;
                    updatedAt: Date;
                    sessionId?: string | undefined;
                    user_name: string;
                    historyId: string;
                }[];
                files: string[];
                prompt: string;
                state: string;
                waiting: boolean;
                createdAt: Date;
                updatedAt: Date;
            }[];
            createdAt: Date | null;
            updatedAt: Date | null;
        };
    }>;
    getMessages(collectionId: string, historyId: string, pagination: PaginationQueryDto, request: AuthenticatedRequest): Promise<{
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
    updateName(dto: UpdateProjectDto, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: {
            collectionId: string;
            collectionName: string;
        };
    }>;
    editSession(dto: EditSessionDto, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: import("../stream/entities/chat.entity").Chat;
    }>;
    updateMessage(dto: UpdateProjectUserMessageDto, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: {
            collectionId: string;
            historyId: string;
            messageId: string;
        };
    }>;
    removeHistory(collectionId: string, historyId: string, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: never[];
    }>;
    remove(collectionId: string, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: never[];
    }>;
}

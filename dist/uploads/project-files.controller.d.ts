import { HttpStatus } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { UploadsService } from './uploads.service';
export declare class ProjectFilesController {
    private readonly uploadsService;
    private readonly messages;
    constructor(uploadsService: UploadsService, messages: I18nMessageService);
    findAll(collectionId: string, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: {
            user_name: string;
            fileId: string;
            filename: string;
            originalName: string;
            size: number;
            mimeType: string;
            fullPath: string;
            uploadedAt: Date;
            state: import("./enums/file-state.enum").FileState;
            tag: import("../storage/enums/file-tag.enum").FileTag;
            sourceFileId: string | null;
        }[];
    }>;
}

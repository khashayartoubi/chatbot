import { HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { UploadContextDto } from './dto/upload-context.dto';
import { RenameFileDto } from './dto/rename-file.dto';
import { FileState } from './enums/file-state.enum';
import { UploadsService } from './uploads.service';
export declare class UploadsController {
    private readonly uploadsService;
    private readonly messages;
    constructor(uploadsService: UploadsService, messages: I18nMessageService);
    upload(files: Express.Multer.File[], dto: UploadContextDto, request: AuthenticatedRequest): Promise<{
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
            state: FileState;
            tag: import("../storage/enums/file-tag.enum").FileTag;
            sourceFileId: string | null;
        }[];
    }>;
    getGeneralFiles(request: AuthenticatedRequest): Promise<{
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
            state: FileState;
            tag: import("../storage/enums/file-tag.enum").FileTag;
            sourceFileId: string | null;
        }[];
    }>;
    getStatus(fileId: string, request: AuthenticatedRequest): Promise<{
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
            state: FileState;
            tag: import("../storage/enums/file-tag.enum").FileTag;
            sourceFileId: string | null;
        }[];
    }>;
    rename(fileId: string, dto: RenameFileDto, request: AuthenticatedRequest): Promise<{
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
            state: FileState;
            tag: import("../storage/enums/file-tag.enum").FileTag;
            sourceFileId: string | null;
        };
    }>;
    remove(fileId: string, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: {
            fileId: string;
        };
    }>;
    preview(fileId: string, request: AuthenticatedRequest, response: Response): Promise<void>;
    download(fileId: string, request: AuthenticatedRequest, response: Response): Promise<void>;
}

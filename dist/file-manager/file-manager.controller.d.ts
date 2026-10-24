import { HttpStatus } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { FileManagerListQueryDto } from './dto/file-manager-list-query.dto';
import { ImportFilesDto } from './dto/import-files.dto';
import { UploadFileManagerFilesDto } from './dto/upload-file-manager-files.dto';
import { FileManagerService } from './file-manager.service';
export declare class FileManagerController {
    private readonly fileManagerService;
    private readonly messages;
    constructor(fileManagerService: FileManagerService, messages: I18nMessageService);
    getRecent(query: FileManagerListQueryDto, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: unknown;
    }>;
    getStorage(request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: unknown;
    }>;
    upload(files: Express.Multer.File[], dto: UploadFileManagerFilesDto, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: unknown;
    }>;
    import(collectionId: string, dto: ImportFilesDto, request: AuthenticatedRequest): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: unknown;
    }>;
    private response;
}

import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { ProjectsService } from '../projects/projects.service';
import { UploadsService } from '../uploads/uploads.service';
import type { FileManagerListQueryDto } from './dto/file-manager-list-query.dto';
export declare class FileManagerService {
    private readonly httpService;
    private readonly configService;
    private readonly projectsService;
    private readonly uploadsService;
    private readonly messages;
    constructor(httpService: HttpService, configService: ConfigService, projectsService: ProjectsService, uploadsService: UploadsService, messages: I18nMessageService);
    getRecent(query: FileManagerListQueryDto, token: string): Promise<unknown>;
    getStorage(token: string): Promise<unknown>;
    upload(files: Express.Multer.File[], folderId: string, token: string): Promise<unknown>;
    import(fileIds: string[], collectionId: string, username: string, token: string): Promise<{
        user_name: string;
        fileId: string;
        filename: string;
        originalName: string;
        size: number;
        mimeType: string;
        fullPath: string;
        uploadedAt: Date;
        state: import("../uploads/enums/file-state.enum").FileState;
        tag: import("../storage/enums/file-tag.enum").FileTag;
        sourceFileId: string | null;
    }[]>;
    private download;
    private request;
    private baseUrl;
    private location;
    private maxFileSize;
    private tempDirectory;
    private authorization;
    private responseFileName;
    private removeTempFiles;
}

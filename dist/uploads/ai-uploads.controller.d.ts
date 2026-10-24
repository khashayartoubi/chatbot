import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { RegisterAiFileDto } from './dto/register-ai-file.dto';
import { UploadsService } from './uploads.service';
export declare class AiUploadsController {
    private readonly uploadsService;
    private readonly configService;
    private readonly messages;
    constructor(uploadsService: UploadsService, configService: ConfigService, messages: I18nMessageService);
    register(apiKey: string | undefined, dto: RegisterAiFileDto): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: {
            fileId: string;
            filename: string;
            originalName: string;
            mimeType: string;
            size: number;
            bucket: string;
            objectName: string | undefined;
            fullPath: string | undefined;
            tag: import("../storage/enums/file-tag.enum").FileTag;
            sourceFileId: string | undefined;
        }[];
    }>;
}

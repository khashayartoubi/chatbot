import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { Repository } from 'typeorm';
import { MinioService } from '../storage/minio.service';
import { UpdateBackgroundDto } from './dto/update-background.dto';
import { Background } from './entities/background.entity';
export declare class BackgroundService {
    private readonly backgroundRepository;
    private readonly minioService;
    private readonly messages;
    constructor(backgroundRepository: Repository<Background>, minioService: MinioService, messages: I18nMessageService);
    get(username: string): Promise<Background>;
    update(username: string, dto: UpdateBackgroundDto): Promise<Background>;
    uploadImage(username: string, file: Express.Multer.File): Promise<Background>;
    preview(username: string): Promise<{
        stream: import("stream").Readable;
        size: number;
        background: Background;
    }>;
    private databaseError;
}

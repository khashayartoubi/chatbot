import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { LogManager } from '../common/logger/log-manager.service';
import { DanaService } from '../dana/dana.service';
import { MinioService } from '../storage/minio.service';
import type { CreateAnalysisDto } from './dto/create-analysis.dto';
import { WorkbookAnalysis } from './entities/workbook-analysis.entity';
import { WorkbookRow } from './entities/workbook-row.entity';
import { WorkbookSheetEntity } from './entities/workbook-sheet.entity';
import { Workbook } from './entities/workbook.entity';
import type { SheetRowsResponse } from './interfaces/sheet-rows-response.interface';
import type { CreateWorkbookResult, WorkbookResult, WorkbookSheetsResult } from './interfaces/workbook-api.interface';
export declare class WorkbookService {
    private readonly workbooksRepository;
    private readonly sheetsRepository;
    private readonly rowsRepository;
    private readonly analysesRepository;
    private readonly minioService;
    private readonly danaService;
    private readonly configService;
    private readonly messages;
    private readonly logger;
    constructor(workbooksRepository: Repository<Workbook>, sheetsRepository: Repository<WorkbookSheetEntity>, rowsRepository: Repository<WorkbookRow>, analysesRepository: Repository<WorkbookAnalysis>, minioService: MinioService, danaService: DanaService, configService: ConfigService, messages: I18nMessageService, logger: LogManager);
    create(file: Express.Multer.File, username: string, organizationId: string): Promise<CreateWorkbookResult>;
    findOne(workbookId: string, username: string, organizationId: string): Promise<WorkbookResult>;
    getSheets(workbookId: string, username: string, organizationId: string): Promise<WorkbookSheetsResult>;
    getRows(sheetId: string, username: string, organizationId: string, offset: number, limit: number): Promise<SheetRowsResponse>;
    createAnalysis(workbookId: string, dto: CreateAnalysisDto, username: string, organizationId: string, idempotencyKey?: string): Promise<{
        analysisId: string;
        status: string;
    }>;
    getAnalysis(analysisId: string, username: string, organizationId: string): Promise<{
        error?: string | undefined;
        result?: {
            answer: string;
            chart?: unknown;
            changes?: unknown[];
        } | undefined;
        analysisId: string;
        status: string;
    }>;
    private parseWorkbook;
    private runAnalysis;
    private findOwnedWorkbook;
    private findOwnedSheet;
    private workbookMetadata;
    private databaseNumber;
    private uniqueHeaders;
    private jsonValue;
    private validSelectedCells;
    private validateFile;
    private sha256;
    private readStream;
    private deterministicId;
    private error;
}

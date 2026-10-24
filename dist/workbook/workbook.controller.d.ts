import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { WorkbookService } from './workbook.service';
import { CreateAnalysisDto } from './dto/create-analysis.dto';
export declare class WorkbookController {
    private readonly workbookService;
    private readonly messages;
    constructor(workbookService: WorkbookService, messages: I18nMessageService);
    create(file: Express.Multer.File | undefined, request: AuthenticatedRequest): Promise<import("./interfaces/workbook-api.interface").CreateWorkbookResult>;
    findOne(workbookId: string, request: AuthenticatedRequest): Promise<import("./interfaces/workbook-api.interface").WorkbookResult>;
    getSheets(workbookId: string, request: AuthenticatedRequest): Promise<import("./interfaces/workbook-api.interface").WorkbookSheetsResult>;
    createAnalysis(workbookId: string, dto: CreateAnalysisDto, idempotencyKey: string | undefined, request: AuthenticatedRequest): Promise<{
        analysisId: string;
        status: string;
    }>;
    private organizationId;
}

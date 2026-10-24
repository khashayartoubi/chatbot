import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { WorkbookService } from './workbook.service';
export declare class WorkbookAnalysesController {
    private readonly workbookService;
    constructor(workbookService: WorkbookService);
    findOne(analysisId: string, request: AuthenticatedRequest): Promise<{
        error?: string | undefined;
        result?: {
            answer: string;
            chart?: unknown;
            changes?: unknown[];
        } | undefined;
        analysisId: string;
        status: string;
    }>;
}

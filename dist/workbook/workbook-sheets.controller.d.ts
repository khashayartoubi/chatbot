import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { SheetRowsQueryDto } from './dto/sheet-rows-query.dto';
import { WorkbookService } from './workbook.service';
export declare class WorkbookSheetsController {
    private readonly workbookService;
    constructor(workbookService: WorkbookService);
    getRows(sheetId: string, query: SheetRowsQueryDto, request: AuthenticatedRequest): Promise<import("./interfaces/sheet-rows-response.interface").SheetRowsResponse>;
    private organizationId;
}

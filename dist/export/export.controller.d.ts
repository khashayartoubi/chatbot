import type { Response } from 'express';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { ExportSessionDto } from './dto/export-session.dto';
import { ExportService } from './export.service';
export declare class ExportController {
    private readonly exportService;
    constructor(exportService: ExportService);
    exportSession(dto: ExportSessionDto, request: AuthenticatedRequest, response: Response): Promise<void>;
}

import { ExportFormat } from '../enums/export-format.enum';
export declare class ExportSessionDto {
    historyId: string;
    format: ExportFormat;
    collectionId?: string;
}

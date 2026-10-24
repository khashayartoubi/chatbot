export interface WorkbookSheetsResponse {
    sheets: Array<{
        sheet_id: string;
        name: string;
        index: number;
        row_count: number;
        column_count: number;
    }>;
}

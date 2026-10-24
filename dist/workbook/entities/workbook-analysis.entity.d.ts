export declare class WorkbookAnalysis {
    analysisId: string;
    workbookId: string;
    versionId: string;
    organizationId: string;
    username: string;
    question: string;
    chartRequested: boolean;
    selectedCells: string;
    status: string;
    result: {
        answer: string;
        chart?: unknown;
        changes?: unknown[];
    } | null;
    error: string | null;
    idempotencyKey: string | null;
    createdAt: Date;
    updatedAt: Date;
}

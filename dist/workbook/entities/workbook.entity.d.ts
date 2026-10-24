export declare class Workbook {
    jobId: number;
    workbookId: string;
    versionId: string;
    organizationId: string;
    username: string;
    originalName: string;
    mimeType: string;
    size: string;
    sha256: string;
    bucket: string;
    objectKey: string;
    currentVersion: number;
    status: string;
    lastError: string | null;
    createdAt: Date;
    updatedAt: Date;
}

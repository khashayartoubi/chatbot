declare class SessionDataDto {
    historyName?: string;
    translate?: string[];
    reasoning?: boolean;
}
export declare class EditSessionDto {
    data: SessionDataDto;
    collectionId?: string | null;
    historyId: string;
}
export {};

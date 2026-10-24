export declare class GeneralSessionDataDto {
    historyName?: string;
    translate?: string[];
    reasoning?: boolean;
}
export declare class EditGeneralSessionDto {
    data: GeneralSessionDataDto;
    historyId: string;
}

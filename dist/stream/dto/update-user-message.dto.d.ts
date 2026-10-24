export declare class UpdateUserMessageDto {
    historyId: string;
    messageId: string;
    message: string;
}
export declare class UpdateProjectUserMessageDto extends UpdateUserMessageDto {
    collectionId: string;
}

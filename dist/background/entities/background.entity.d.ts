import { BackgroundFit } from '../enums/background-fit.enum';
export declare class Background {
    id: string;
    username: string;
    objectName?: string;
    fullPath?: string;
    originalName?: string;
    mimeType?: string;
    userMessageBackgroundColor: string;
    userMessageTextColor: string;
    enabled: boolean;
    fit: BackgroundFit;
    overlay: string;
    blur: boolean;
    applyToAll: boolean;
    updatedAt: Date;
}

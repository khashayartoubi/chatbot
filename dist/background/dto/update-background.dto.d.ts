import { BackgroundFit } from '../enums/background-fit.enum';
export declare class UpdateBackgroundDto {
    userMessageBackgroundColor?: string;
    userMessageTextColor?: string;
    enabled?: boolean;
    fit?: BackgroundFit;
    overlay?: string;
    blur?: boolean;
    applyToAll?: boolean;
}

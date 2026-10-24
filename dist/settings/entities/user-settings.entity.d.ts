import { DefaultLanguage } from '../enums/default-language.enum';
import { FontSize } from '../enums/font-size.enum';
export declare class UserSettings {
    id: string;
    username: string;
    fontSize: FontSize;
    defaultLanguage: DefaultLanguage;
    updatedAt: Date;
}

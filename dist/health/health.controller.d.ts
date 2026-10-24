import { HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
export declare class HealthController {
    private readonly messages;
    private readonly dataSource;
    constructor(messages: I18nMessageService, dataSource: DataSource);
    check(): Promise<{
        success: boolean;
        status: HttpStatus;
        message: string;
        data: never[];
    }>;
}

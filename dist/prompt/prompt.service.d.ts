import { DataSource, Repository } from 'typeorm';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { Prompt } from './entities/prompt.entity';
export declare class PromptService {
    private readonly promptRepository;
    private readonly dataSource;
    private readonly messages;
    constructor(promptRepository: Repository<Prompt>, dataSource: DataSource, messages: I18nMessageService);
    create(username: string, dto: CreatePromptDto): Promise<Prompt>;
    findAll(username: string): Promise<Prompt[]>;
    findActive(username: string): Promise<Prompt | null>;
    findOne(promptId: string, username: string): Promise<Prompt>;
    update(promptId: string, username: string, dto: UpdatePromptDto): Promise<Prompt>;
    remove(promptId: string, username: string): Promise<void>;
    private databaseError;
}

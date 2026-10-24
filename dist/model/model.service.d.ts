import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { I18nMessageService } from '../common/i18n/i18n-message.service';
import { Project } from '../projects/entities/project.entity';
import { Chat } from '../stream/entities/chat.entity';
import type { SetModelDto } from './dto/set-model.dto';
import type { Model } from './interfaces/model.interface';
import { ConfigService } from '@nestjs/config';
export declare class ModelService {
    private readonly httpService;
    private readonly configService;
    private readonly chatsRepository;
    private readonly projectsRepository;
    private readonly messages;
    constructor(httpService: HttpService, configService: ConfigService, chatsRepository: Repository<Chat>, projectsRepository: Repository<Project>, messages: I18nMessageService);
    getModels(): Promise<Model[]>;
    setModel(dto: SetModelDto, username: string): Promise<number>;
    private findProject;
    private databaseError;
}

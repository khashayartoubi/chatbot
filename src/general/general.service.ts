import { Injectable } from '@nestjs/common';
import type { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Chat } from '../stream/entities/chat.entity';
import { StreamService } from '../stream/stream.service';
import { SocketEventsService } from '../socket/services/socket-events.service';
import { UpdateUserMessageDto } from '../stream/dto/update-user-message.dto';
import { EditGeneralSessionDto } from './dto/edit-general-session.dto';
import { GeneralFile } from './entities/general-file.entity';
import { GeneralHistory } from './entities/general-history.entity';
import type { UserMessageUpdater } from './interfaces/user-message-updater.interface';

@Injectable()
export class GeneralService {
  constructor(
    private readonly streamService: StreamService,
    private readonly socketEventsService: SocketEventsService
  ) {}

  async getHistories(username: string, pagination?: PaginationQueryDto): Promise<GeneralHistory[]> {
    const histories = await this.streamService.getHistories(username, undefined, pagination);
    this.socketEventsService.history(username, histories);
    return histories.map((history) => Object.assign(new GeneralHistory(), history));
  }

  async getHistoryFiles(username: string, historyId: string): Promise<GeneralFile[]> {
    const files = await this.streamService.getGeneralHistoryFiles(username, historyId);
    return files.map((file) => Object.assign(new GeneralFile(), file));
  }

  async getMessages(username: string, historyId: string, pagination?: PaginationQueryDto) {
    return this.streamService.getMessages(historyId, username, undefined, pagination);
  }

  async editSession(dto: EditGeneralSessionDto, username: string): Promise<Chat> {
    const chat = await this.streamService.editSession(
      {
        data: dto.data,
        historyId: dto.historyId,
        collectionId: null,
      },
      username
    );
    await this.emitHistory(username);
    return chat;
  }

  async remove(historyId: string, username: string): Promise<void> {
    await this.streamService.remove(historyId, username);
    await this.emitHistory(username);
  }

  async removeAll(username: string): Promise<number> {
    const deletedCount = await this.streamService.removeAllGeneralHistories(username);
    await this.emitHistory(username);
    return deletedCount;
  }

  async updateMessage(dto: UpdateUserMessageDto, username: string): Promise<void> {
    const messageUpdater: UserMessageUpdater = this.streamService;
    await messageUpdater.updateUserMessage(dto, username);
  }

  private async emitHistory(username: string): Promise<void> {
    const histories = await this.streamService.getHistories(username);
    this.socketEventsService.history(username, histories);
  }
}

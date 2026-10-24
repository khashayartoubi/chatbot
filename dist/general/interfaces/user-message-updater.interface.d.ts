import type { UpdateUserMessageDto } from '../../stream/dto/update-user-message.dto';
export interface UserMessageUpdater {
    updateUserMessage(dto: UpdateUserMessageDto, username: string): Promise<void>;
}

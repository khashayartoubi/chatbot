import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsDefined, IsEnum, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { MessageType } from '../enums/message-type.enum';
import { SelectionMode } from '../enums/selection-mode.enum';
import { AnswerStatus } from '../enums/answer-status.enum';
import { swaggerMessage } from '../../common/i18n/swagger-message';

const parseJson = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

export class StreamChatMessageDto {
  @ApiPropertyOptional({ example: '26961015353752' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  unread = false;

  @ApiPropertyOptional({
    enum: MessageType,
    default: MessageType.TEXT,
  })
  @IsOptional()
  @IsEnum(MessageType)
  type: MessageType = MessageType.TEXT;

  @ApiPropertyOptional({
    default: '',
    example: 'سلام',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  message = '';

  @ApiPropertyOptional({
    default: '',
    example: 'سلام، این متن اصلی پیام است',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  text?: string;

  @ApiPropertyOptional({ default: '' })
  @IsOptional()
  @IsString()
  letter_operation?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  bot = false;

  @ApiPropertyOptional({ default: '' })
  @IsOptional()
  @IsString()
  avatar = '';

  @ApiPropertyOptional({
    type: [String],
    description: swaggerMessage('swagger.field.fileIds'),
    default: [],
  })
  @Transform(parseJson)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments: string[] = [];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  liked = false;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  disLiked = false;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  starred = false;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  delivered = false;

  @ApiPropertyOptional({ default: '' })
  @IsOptional()
  @IsString()
  comment = '';

  @ApiPropertyOptional({
    type: 'array',
    items: {},
    default: [],
  })
  @IsOptional()
  @IsArray()
  reply: unknown[] = [];

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2026-07-28T12:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  createdAt?: string;
}

class MessageSchemaDto {
  @ApiProperty({ type: StreamChatMessageDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => StreamChatMessageDto)
  message!: StreamChatMessageDto;
}

export class StreamMessageDto {
  @ApiPropertyOptional({ enum: AnswerStatus, default: AnswerStatus.PENDING })
  @IsOptional()
  @IsEnum(AnswerStatus)
  answerStatus?: AnswerStatus;

  @ApiPropertyOptional({
    default: false,
    description: swaggerMessage('swagger.field.retryMessage'),
  })
  @IsOptional()
  @IsBoolean()
  retry = false;

  @ApiPropertyOptional({
    description: swaggerMessage('swagger.field.newGeneralHistory'),
    example: '58874487695203',
  })
  @IsOptional()
  @IsString()
  historyId?: string;

  @ApiPropertyOptional({
    description: swaggerMessage('swagger.field.nullableProjectId'),
    example: null,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  collectionId?: string | null;

  @ApiPropertyOptional({
    description: swaggerMessage('swagger.field.legacyProjectId'),
    example: '4f8c878b63b047b5b450ee39760ba249',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({
    description: swaggerMessage('swagger.field.clientSessionId'),
    example: '10894872377576',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({
    example: SelectionMode.GENERAL_CHAT,
    description: swaggerMessage('swagger.field.optionalSelectionMode'),
    default: SelectionMode.GENERAL_CHAT,
    enum: SelectionMode,
  })
  @IsOptional()
  @IsEnum(SelectionMode)
  selectionMode: SelectionMode = SelectionMode.GENERAL_CHAT;

  @ApiPropertyOptional({ default: '' })
  @IsOptional()
  @IsString()
  letter_operation?: string;

  @ApiPropertyOptional({ default: '' })
  @IsOptional()
  @IsString()
  translate?: string;

  @ApiPropertyOptional({
    type: [String],
    description: swaggerMessage('swagger.field.legacyFileIds'),
    default: [],
  })
  @Transform(parseJson)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileIds: string[] = [];

  @ApiProperty({ type: MessageSchemaDto })
  @IsDefined()
  @Transform(parseJson)
  @ValidateNested()
  @Type(() => MessageSchemaDto)
  messageSchema!: MessageSchemaDto;
}

export class StreamMultipartDto {
  @ApiProperty({ type: StreamMessageDto })
  @Transform(parseJson)
  @ValidateNested()
  @Type(() => StreamMessageDto)
  payload!: StreamMessageDto;
}

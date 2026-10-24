import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { swaggerMessage } from '../../common/i18n/swagger-message';
// import { SelectionMode } from '../enums/selection-mode.enum';

export class UpdateUserMessageDto {
  @ApiProperty({ description: swaggerMessage('swagger.field.historyId'), example: '58874487695203' })
  @IsString()
  @MinLength(1)
  historyId!: string;

  @ApiProperty({ description: swaggerMessage('swagger.field.messageId'), example: '26961015353752' })
  @IsString()
  @MinLength(1)
  messageId!: string;

  @ApiProperty({ description: swaggerMessage('swagger.field.updatedMessage'), example: 'متن ویرایش‌ شده پیام' })
  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  message!: string;

  // @ApiPropertyOptional({ enum: SelectionMode, default: SelectionMode.GENERAL_CHAT })
  // @IsOptional()
  // @IsEnum(SelectionMode)
  // selectionMode: SelectionMode = SelectionMode.GENERAL_CHAT;
}

export class UpdateProjectUserMessageDto extends UpdateUserMessageDto {
  @ApiProperty({ description: swaggerMessage('swagger.field.projectId'), example: '10894872377576' })
  @IsString()
  @MinLength(1)
  collectionId!: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { swaggerMessage } from '../../common/i18n/swagger-message';

export class TransferHistoryDto {
  @ApiProperty({ type: String, description: swaggerMessage('swagger.field.historyId'), example: '58874487695203' })
  @IsString()
  @MinLength(1)
  historyId!: string;

  @ApiProperty({ type: String, description: swaggerMessage('swagger.field.sourceCollectionId'), example: '' })
  @IsString()
  sourceCollectionId!: string;

  @ApiProperty({ type: String, description: swaggerMessage('swagger.field.targetCollectionId'), example: '10894872377576' })
  @IsString()
  targetCollectionId!: string;
}

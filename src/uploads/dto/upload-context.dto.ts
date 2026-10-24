import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { swaggerMessage } from '../../common/i18n/swagger-message';

export class UploadContextDto {
  @ApiPropertyOptional({
    description: swaggerMessage('swagger.field.optionalProjectId'),
  })
  @IsOptional()
  @IsString()
  collectionId?: string;

  @ApiPropertyOptional({
    description: swaggerMessage('swagger.field.historyId'),
    example: '58874487695203',
  })
  @IsOptional()
  @IsString()
  historyId?: string;
}

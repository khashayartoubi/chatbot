import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, ValidateIf } from 'class-validator';
import { swaggerMessage } from '../../common/i18n/swagger-message';

export class PinSessionDto {
  @ApiPropertyOptional({ type: String, description: swaggerMessage('swagger.field.historyId'), example: '58874487695203' })
  @ValidateIf((_object, value: unknown) => value !== undefined && value !== null && value !== '')
  @IsString()
  @MinLength(1)
  historyId?: string | null;

  @ApiPropertyOptional({ type: String, description: swaggerMessage('swagger.field.projectPinId'), example: '10894872377576' })
  @ValidateIf((_object, value: unknown) => value !== undefined && value !== null && value !== '')
  @IsString()
  @MinLength(1)
  collectionId?: string | null;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsMimeType, IsOptional, IsPositive, IsString } from 'class-validator';
import { swaggerMessage } from '../../common/i18n/swagger-message';

export class RegisterAiFileDto {
  @ApiProperty({ example: 'khashayar' })
  @IsString()
  username!: string;

  @ApiProperty({ example: '19479117259861' })
  @IsString()
  fileId!: string;

  @ApiProperty({
    description: swaggerMessage('swagger.field.sourceFileId'),
    example: '19479117259861',
  })
  @IsString()
  sourceFileId!: string;

  @ApiProperty({ example: 'dana-client' })
  @IsString()
  bucket!: string;

  @ApiProperty({ example: 'khashayar/upload-id/document.pdf' })
  @IsString()
  objectName!: string;

  @ApiProperty({ example: 'document.pdf' })
  @IsString()
  filename!: string;

  @ApiPropertyOptional({ example: 'document.pdf' })
  @IsOptional()
  @IsString()
  originalName?: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsMimeType()
  mimeType?: string;

  @ApiPropertyOptional({ example: 1024 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  size?: number;
}

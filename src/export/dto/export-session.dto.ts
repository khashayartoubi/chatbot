import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { ExportFormat } from '../enums/export-format.enum';

export class ExportSessionDto {
  @ApiProperty({
    example: '8f9d2c3a',
  })
  @IsString()
  historyId: string = '';

  @ApiProperty({
    enum: ExportFormat,
    default: ExportFormat.TEXT,
  })
  @IsIn(Object.values(ExportFormat))
  format: ExportFormat = ExportFormat.TEXT;

  @ApiProperty({
    example: '8f9d2c3a',
  })
  @IsOptional()
  @IsString()
  collectionId?: string;
}

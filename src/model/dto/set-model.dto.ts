import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class SetModelDto {
  @ApiProperty({ type: String, example: 'gemma4:31b' })
  @IsString()
  @Matches(/\S/)
  modelName!: string;

  @ApiPropertyOptional({ type: String, example: '58874487695203' })
  @IsOptional()
  @IsString()
  historyId?: string;

  @ApiPropertyOptional({ type: String, example: '10894872377576' })
  @IsOptional()
  @IsString()
  collectionId?: string;
}

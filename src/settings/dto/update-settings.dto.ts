import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { DefaultLanguage } from '../enums/default-language.enum';
import { FontSize } from '../enums/font-size.enum';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ enum: FontSize, example: FontSize.MEDIUM })
  @IsOptional()
  @IsEnum(FontSize)
  fontSize?: FontSize;

  @ApiPropertyOptional({
    enum: DefaultLanguage,
    example: DefaultLanguage.PERSIAN,
  })
  @IsOptional()
  @IsEnum(DefaultLanguage)
  defaultLanguage?: DefaultLanguage;
}

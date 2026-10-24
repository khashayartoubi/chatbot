import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';

export class GeneralSessionDataDto {
  @ApiPropertyOptional({ example: 'نام جدید گفتگو' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  historyName?: string;

  @ApiPropertyOptional({ type: [String], enum: ['fa', 'en'] })
  @IsOptional()
  @IsArray()
  @IsIn(['fa', 'en'], { each: true })
  translate?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  reasoning?: boolean;
}

export class EditGeneralSessionDto {
  @ApiProperty({ type: GeneralSessionDataDto })
  @ValidateNested()
  @Type(() => GeneralSessionDataDto)
  data!: GeneralSessionDataDto;

  @ApiProperty({ example: '58874487695203' })
  @IsString()
  historyId!: string;
}

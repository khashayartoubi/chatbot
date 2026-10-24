import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';

class SessionDataDto {
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

export class EditSessionDto {
  @ApiProperty({ type: SessionDataDto })
  @ValidateNested()
  @Type(() => SessionDataDto)
  data!: SessionDataDto;

  @ApiPropertyOptional({
    nullable: true,
    example: '4f8c878b63b047b5b450ee39760ba249',
  })
  @IsOptional()
  @IsString()
  collectionId?: string | null;

  @ApiProperty({ example: '58874487695203' })
  @IsString()
  historyId!: string;
}

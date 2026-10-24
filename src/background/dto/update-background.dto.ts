import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsHexColor, IsOptional } from 'class-validator';
import { BackgroundFit } from '../enums/background-fit.enum';

export class UpdateBackgroundDto {
  @ApiPropertyOptional({ example: '#3B82F6' })
  @IsOptional()
  @IsHexColor()
  userMessageBackgroundColor?: string;

  @ApiPropertyOptional({ example: '#FFFFFF' })
  @IsOptional()
  @IsHexColor()
  userMessageTextColor?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ enum: BackgroundFit, example: BackgroundFit.COVER, default: BackgroundFit.COVER })
  @IsOptional()
  @IsEnum(BackgroundFit)
  fit?: BackgroundFit;

  @ApiPropertyOptional({ example: '#F5827A66', default: '#F5827A66' })
  @IsOptional()
  // @IsHexColor()
  overlay?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  blur?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  applyToAll?: boolean;
}

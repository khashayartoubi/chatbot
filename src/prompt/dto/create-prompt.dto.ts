import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePromptDto {
  @ApiProperty({ example: 'خلاصه‌سازی' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'متن زیر را به‌صورت خلاصه توضیح بده.' })
  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  prompt!: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

export class RenameFileDto {
  @ApiProperty({ type: String, example: 'گزارش جدید.pdf' })
  @IsString()
  @Matches(/\S/)
  @MaxLength(240)
  filename!: string;
}

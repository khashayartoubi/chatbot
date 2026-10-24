import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';

export class NodePositionDto {
  @IsString()
  id!: string;

  @IsNumber()
  fx!: number;

  @IsNumber()
  fy!: number;
}

export class SaveGraphPositionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NodePositionDto)
  position!: NodePositionDto[];
}

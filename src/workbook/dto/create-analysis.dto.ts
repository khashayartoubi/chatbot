import { IsBoolean, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAnalysisDto {
  @IsUUID()
  versionId!: string;

  @IsString()
  @MaxLength(10_000)
  question!: string;

  @IsBoolean()
  chartRequested!: boolean;

  @IsString()
  @MaxLength(10_000)
  selectedCells!: string;
}

import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, ValidateNested } from 'class-validator';
import { MaxLengthFromEnv } from '../../common/validators/max-length-from-env.validator';

class ProjectDataDto {
  @ApiProperty({ example: 'نام جدید پروژه' })
  @IsString()
  @MinLength(1)
  @MaxLengthFromEnv('COLLECTION_NAME_MAX_LENGTH', 100)
  name!: string;
}

export class UpdateProjectDto {
  @ApiProperty({ example: '4f8c878b63b047b5b450ee39760ba249' })
  @IsString()
  collectionId!: string;

  @ApiProperty({ type: ProjectDataDto })
  @ValidateNested()
  @Type(() => ProjectDataDto)
  collectionData!: ProjectDataDto;
}

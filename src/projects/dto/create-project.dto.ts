import { Type } from 'class-transformer';
import { IsHexColor, IsString, MinLength, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { swaggerMessage } from '../../common/i18n/swagger-message';
import { MaxLengthFromEnv } from '../../common/validators/max-length-from-env.validator';

export class ProjectDataDto {
  @ApiProperty({
    example: 'My Collection',
    description: swaggerMessage('swagger.field.projectName'),
  })
  @IsString()
  @MinLength(1)
  @MaxLengthFromEnv('COLLECTION_NAME_MAX_LENGTH', 100)
  name!: string;

  @ApiProperty({
    example: '#FF5733',
    description: swaggerMessage('swagger.field.projectColor'),
  })
  @IsHexColor()
  color!: string;

  @ApiProperty({
    example: 'folder-icon',
    description: swaggerMessage('swagger.field.projectIcon'),
  })
  @IsString()
  @MaxLengthFromEnv('COLLECTION_ICON_MAX_LENGTH', 500)
  icon!: string;
}

export class CreateProjectDto {
  @ApiProperty({
    type: ProjectDataDto,
  })
  @ValidateNested()
  @Type(() => ProjectDataDto)
  collectionData!: ProjectDataDto;
}

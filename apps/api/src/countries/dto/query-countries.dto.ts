import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  SORTABLE_FIELDS,
  type SortOrder,
  type SortableField,
} from '@worldscope/shared';

const emptyToUndefined = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class QueryCountriesDto {
  @ApiPropertyOptional({ minimum: 1, default: 1, description: 'Page number (1-based).' })
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: MAX_PAGE_SIZE,
    default: DEFAULT_PAGE_SIZE,
    description: 'Items per page.',
  })
  @Transform(emptyToUndefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  @IsOptional()
  limit: number = DEFAULT_PAGE_SIZE;

  @ApiPropertyOptional({ description: 'Case-insensitive search on common and official names.' })
  @Transform(trimString)
  @IsString()
  @MaxLength(80)
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Exact region name, e.g. "Americas".' })
  @Transform(trimString)
  @IsString()
  @MaxLength(60)
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({ description: 'Exact subregion name, e.g. "South America".' })
  @Transform(trimString)
  @IsString()
  @MaxLength(60)
  @IsOptional()
  subregion?: string;

  @ApiPropertyOptional({ enum: SORTABLE_FIELDS, default: 'name' })
  @IsIn(SORTABLE_FIELDS)
  @IsOptional()
  sortBy: SortableField = 'name';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  order: SortOrder = 'asc';
}

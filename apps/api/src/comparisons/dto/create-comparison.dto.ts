import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { MAX_COMPARE_COUNTRIES, MIN_COMPARE_COUNTRIES } from '@worldscope/shared';

const ISO3 = /^[A-Z]{3}$/;

export class CreateComparisonDto {
  @ApiPropertyOptional({ example: 'South America at a glance', maxLength: 120 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(120)
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: ['BRA', 'ARG', 'CHL'],
    description: `Between ${MIN_COMPARE_COUNTRIES} and ${MAX_COMPARE_COUNTRIES} ISO alpha-3 codes.`,
  })
  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value)
      ? value.map((code) => (typeof code === 'string' ? code.trim().toUpperCase() : code))
      : value,
  )
  @IsArray()
  @ArrayMinSize(MIN_COMPARE_COUNTRIES)
  @ArrayMaxSize(MAX_COMPARE_COUNTRIES)
  @Matches(ISO3, { each: true, message: 'each code must be a 3-letter ISO alpha-3 code' })
  codes!: string[];
}

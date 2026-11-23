import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, Matches } from 'class-validator';
import { MAX_COMPARE_COUNTRIES, MIN_COMPARE_COUNTRIES } from '@worldscope/shared';

const ISO3 = /^[A-Z]{3}$/;

export class CompareQueryDto {
  @ApiProperty({
    example: 'BRA,USA',
    description: `Comma-separated ISO alpha-3 codes (${MIN_COMPARE_COUNTRIES} to ${MAX_COMPARE_COUNTRIES}).`,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((code) => code.trim().toUpperCase())
          .filter((code) => code.length > 0)
      : value,
  )
  @IsArray()
  @ArrayMinSize(MIN_COMPARE_COUNTRIES)
  @ArrayMaxSize(MAX_COMPARE_COUNTRIES)
  @Matches(ISO3, { each: true, message: 'each code must be a 3-letter ISO 3166-1 alpha-3 code' })
  codes!: string[];
}

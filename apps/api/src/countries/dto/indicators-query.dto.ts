import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class IndicatorsQueryDto {
  @ApiPropertyOptional({
    minimum: 5,
    maximum: 30,
    default: 12,
    description: 'How many years of history to request.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(30)
  @IsOptional()
  years: number = 12;
}

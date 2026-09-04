import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from "class-validator";
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export class CreatePaymentDto {
  @ApiProperty({ minimum: 1 }) @IsInt() @Min(1) @Max(10_000_000_000) amountVnd!: number;
  // Tuition month this payment settles ("YYYY-MM"), independent of when the
  // money actually arrived — keeps month buckets accounting-correct.
  @ApiPropertyOptional({ pattern: MONTH_PATTERN.source })
  @IsOptional() @Matches(MONTH_PATTERN) appliesToMonth?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

export class UpdatePaymentDto {
  @ApiProperty({ minimum: 1 }) @IsInt() @Min(1) @Max(10_000_000_000) amountVnd!: number;
  @ApiProperty({ pattern: MONTH_PATTERN.source })
  @Matches(MONTH_PATTERN) appliesToMonth!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

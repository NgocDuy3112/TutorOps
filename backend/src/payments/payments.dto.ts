import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from "class-validator";

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const MAX_AMOUNT_VND = 100_000_000;

export class CreatePaymentDto {
  @ApiProperty({ minimum: 1 }) @IsInt() @Min(1) @Max(MAX_AMOUNT_VND) amountVnd!: number;
  @ApiPropertyOptional({ pattern: MONTH_PATTERN.source })
  @IsOptional() @Matches(MONTH_PATTERN) appliesToMonth?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

export class AssignPaymentClassDto {
  @ApiProperty({ format: "uuid" }) @IsUUID() classId!: string;
}

export class UpdatePaymentDto {
  @ApiProperty({ minimum: 1 }) @IsInt() @Min(1) @Max(MAX_AMOUNT_VND) amountVnd!: number;
  @ApiProperty({ pattern: MONTH_PATTERN.source })
  @Matches(MONTH_PATTERN) appliesToMonth!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

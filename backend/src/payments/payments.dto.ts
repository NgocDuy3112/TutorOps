import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
export class CreatePaymentDto {
  @ApiProperty({ minimum: 1 }) @IsInt() @Min(1) @Max(10_000_000_000) amountVnd!: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() paidAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

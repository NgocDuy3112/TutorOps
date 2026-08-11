import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
export class TeachingSessionDto {
  @ApiProperty() @IsDateString() taughtAt!: string;
  @ApiPropertyOptional({ minimum: 0, description: "Mặc định lấy từ học sinh" })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceVnd?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}
export class UpdateTeachingSessionDto {
  @ApiPropertyOptional() @IsOptional() @IsDateString() taughtAt?: string;
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceVnd?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

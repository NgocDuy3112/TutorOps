import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator";
export class TeachingSessionDto {
  @ApiProperty() @IsDateString() taughtAt!: string;
  @ApiPropertyOptional({ description: "Giờ kết thúc (per_hour); VN local" })
  @IsOptional() @IsDateString() endsAt?: string;
  @ApiPropertyOptional({ description: "Lớp áp dụng cách tính giá" })
  @IsOptional() @IsUUID() classId?: string;
  @ApiPropertyOptional({ minimum: 0, description: "Mặc định lấy từ học sinh/lớp" })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000_000_000)
  priceVnd?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}
export class UpdateTeachingSessionDto {
  @ApiPropertyOptional() @IsOptional() @IsDateString() taughtAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endsAt?: string;
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000_000_000)
  priceVnd?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

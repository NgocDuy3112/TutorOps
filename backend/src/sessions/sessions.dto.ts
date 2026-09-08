import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator";

export const SESSION_STATUSES = [
  "unconfirmed",
  "taught",
  "cancelled",
] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export class TeachingSessionDto {
  @ApiProperty() @IsDateString() taughtAt!: string;
  @ApiPropertyOptional({ description: "Giờ kết thúc (per_hour); VN local" })
  @IsOptional() @IsDateString() endsAt?: string;
  @ApiPropertyOptional({ description: "Lớp áp dụng cách tính giá" })
  @IsOptional() @IsUUID() classId?: string;
  @ApiPropertyOptional({ enum: SESSION_STATUSES, default: "unconfirmed" })
  @IsOptional() @IsIn(SESSION_STATUSES) status?: SessionStatus;
  @ApiPropertyOptional({ minimum: 0, description: "Mặc định lấy từ học sinh/lớp" })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000_000_000)
  priceVnd?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}
export class UpdateTeachingSessionDto {
  @ApiPropertyOptional({ enum: SESSION_STATUSES })
  @IsOptional() @IsIn(SESSION_STATUSES) status?: SessionStatus;
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

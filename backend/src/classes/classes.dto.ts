import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export const PRICING_MODES = ["per_session", "per_hour", "per_month"] as const;
export type PricingMode = (typeof PRICING_MODES)[number];

export const VENUES = ["home", "center", "online"] as const;
export type Venue = (typeof VENUES)[number];

export class ClassScheduleSlotDto {
  @ApiProperty({ minimum: 0, maximum: 6, description: "0 = C.Nhật" })
  @IsInt() @Min(0) @Max(6) weekday!: number;
  @ApiProperty({ description: "Giờ bắt đầu, VN local (HH:mm)" })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) startTime!: string;
  @ApiProperty({ description: "Giờ kết thúc, VN local (HH:mm)" })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) endTime!: string;
}

export class CreateClassDto {
  @ApiProperty() @IsString() @MinLength(1) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subject?: string;
  @ApiPropertyOptional({ minimum: 0, description: "Ý nghĩa theo pricingMode" })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000_000_000)
  defaultPriceVnd?: number;
  @ApiPropertyOptional({ enum: PRICING_MODES, default: "per_session" })
  @IsOptional() @IsIn(PRICING_MODES) pricingMode?: PricingMode;
  @ApiPropertyOptional({ description: "Tự động tạo buổi dạy theo lịch cố định" })
  @IsOptional() @IsBoolean() autoSchedule?: boolean;
  @ApiPropertyOptional({ enum: VENUES })
  @IsOptional() @IsIn(VENUES) venue?: Venue;
  @ApiPropertyOptional({ type: [ClassScheduleSlotDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClassScheduleSlotDto)
  schedules?: ClassScheduleSlotDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

export class UpdateClassDto extends CreateClassDto {}

export class ClassStudentDto {
  @ApiProperty() @IsUUID() studentId!: string;
}

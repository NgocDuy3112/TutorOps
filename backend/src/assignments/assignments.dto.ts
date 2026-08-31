import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";
export class CreateAssignmentDto {
  @ApiProperty() @IsString() @MinLength(1) title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() lessonId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dueAt?: string;
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  studentIds!: string[];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  classIds?: string[];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  fileIds?: string[];
}

export class ReviewDropboxSubmissionDto {
  @ApiProperty() @IsUUID() studentId!: string;
  @ApiProperty({ minimum: 0, maximum: 10 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10)
  score!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() reviewNote?: string;
}

export class UpdateAssignmentDto {
  @ApiProperty() @IsString() @MinLength(1) title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() lessonId?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dueAt?: string | null;
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  studentIds!: string[];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  classIds?: string[];
}

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class CreateLessonDto {
  @ApiProperty() @IsString() @MinLength(1) title!: string;
  @ApiProperty() @IsDateString() taughtAt!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() fileId?: string;
}

export class UpdateLessonDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(1) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() taughtAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() fileId?: string;
}

export class AttachLessonFileDto {
  @ApiProperty() @IsUUID() fileId!: string;
}

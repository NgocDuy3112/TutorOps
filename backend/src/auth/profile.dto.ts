import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(1) fullName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
}

export class ChangePasswordDto {
  @ApiProperty() @IsString() currentPassword!: string;
  @ApiProperty() @IsString() @MinLength(8) newPassword!: string;
}

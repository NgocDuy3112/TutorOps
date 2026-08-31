import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  fullName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Matches(/^0\d{9}$/, { message: "Số điện thoại phải có 10 chữ số, bắt đầu bằng 0" }) phone?: string;
}

export class ChangePasswordDto {
  @ApiProperty() @IsString() @MaxLength(64) currentPassword!: string;
  @ApiProperty() @IsString() @MinLength(8) @MaxLength(64) newPassword!: string;
}

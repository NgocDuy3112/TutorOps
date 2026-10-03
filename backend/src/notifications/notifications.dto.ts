import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, IsUrl } from "class-validator";

export class PushKeysDto {
  @ApiProperty() @IsString() p256dh!: string;
  @ApiProperty() @IsString() auth!: string;
}

export class PushSubscriptionDto {
  @ApiProperty() @IsUrl({ require_tld: false }) endpoint!: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() expirationTime?: number | null;
  @ApiProperty({ type: PushKeysDto }) keys!: PushKeysDto;
  @ApiPropertyOptional() @IsOptional() @IsString() userAgent?: string;
}

export class UnsubscribeDto {
  @ApiProperty() @IsUrl({ require_tld: false }) endpoint!: string;
}

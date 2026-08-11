import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUrl } from "class-validator";

export class PushKeysDto {
  @ApiProperty() @IsString() p256dh!: string;
  @ApiProperty() @IsString() auth!: string;
}

export class PushSubscriptionDto {
  @ApiProperty() @IsUrl({ require_tld: false }) endpoint!: string;
  @ApiProperty({ type: PushKeysDto }) keys!: PushKeysDto;
  @ApiPropertyOptional() @IsOptional() @IsString() userAgent?: string;
}

export class UnsubscribeDto {
  @ApiProperty() @IsUrl({ require_tld: false }) endpoint!: string;
}

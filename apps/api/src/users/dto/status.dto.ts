import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class SetStatusDto {
  /**
   * Emoji shown next to the avatar. We accept a small string (1–8 chars)
   * to allow modifier sequences like skin tones / ZWJ joiners. The text
   * is treated opaquely — clients control the rendering.
   */
  @IsOptional()
  @IsString()
  @Length(1, 8)
  emoji?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  text?: string;

  @IsOptional()
  @IsBoolean()
  busy?: boolean;

  /**
   * When the status auto-clears. Null/omitted = never expires.
   * Past values are accepted but are filtered out on read.
   */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date | null;
}

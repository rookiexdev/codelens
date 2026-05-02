import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { SocialProvider } from '../../../prisma/generated/client';

export class SocialLinkInputDto {
  @IsEnum(SocialProvider)
  provider!: SocialProvider;

  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  label?: string;
}

export class ReplaceSocialLinksDto {
  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => SocialLinkInputDto)
  links!: SocialLinkInputDto[];
}

import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { Provider } from '../../../prisma/generated/client';

export class SelectRepoDto {
  @IsEnum(Provider)
  provider!: Provider;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  repoFullName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  repoId!: string;
}

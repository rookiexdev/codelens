import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

enum LogLevel {
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Http = 'http',
  Verbose = 'verbose',
  Debug = 'debug',
  Silly = 'silly',
}

export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  PORT: number = 3001;

  @IsString()
  @MinLength(1)
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32, { message: 'JWT_SECRET must be at least 32 characters' })
  JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '7d';

  @IsEnum(LogLevel)
  @IsOptional()
  LOG_LEVEL?: LogLevel;

  @IsString()
  @IsOptional()
  APP_NAME: string = 'codelens-api';

  @IsString()
  @IsOptional()
  WEB_ORIGIN: string = 'http://localhost:3000';

  @IsInt()
  @Min(1)
  @IsOptional()
  THROTTLE_DEFAULT_LIMIT: number = 60;

  @IsInt()
  @Min(1)
  @IsOptional()
  THROTTLE_DEFAULT_TTL_MS: number = 60_000;

  @IsInt()
  @Min(1)
  @IsOptional()
  THROTTLE_AUTH_LIMIT: number = 5;

  @IsInt()
  @Min(1)
  @IsOptional()
  THROTTLE_AUTH_TTL_MS: number = 60_000;

  @IsString()
  @IsOptional()
  FRONTEND_URL: string = 'http://localhost:3000';

  @IsString()
  @IsOptional()
  GITHUB_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  GITHUB_CLIENT_SECRET?: string;

  @IsString()
  @IsOptional()
  GITHUB_CALLBACK_URL?: string;

  @IsString()
  @IsOptional()
  GITLAB_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  GITLAB_CLIENT_SECRET?: string;

  @IsString()
  @IsOptional()
  GITLAB_CALLBACK_URL?: string;

  @IsString()
  @IsOptional()
  BITBUCKET_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  BITBUCKET_CLIENT_SECRET?: string;

  @IsString()
  @IsOptional()
  BITBUCKET_CALLBACK_URL?: string;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, {
    skipMissingProperties: false,
    forbidUnknownValues: false,
  });
  if (errors.length > 0) {
    const messages = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Invalid environment configuration: ${messages}`);
  }
  return validated;
}

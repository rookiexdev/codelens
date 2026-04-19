import { ConfigService } from '@nestjs/config';
import type { WinstonModuleOptions } from 'nest-winston';
import { utilities as nestWinstonUtilities } from 'nest-winston';
import { format, transports } from 'winston';

type NodeEnv = 'development' | 'production' | 'test';
type LogLevel =
  | 'error'
  | 'warn'
  | 'info'
  | 'http'
  | 'verbose'
  | 'debug'
  | 'silly';

interface LoggerEnv {
  nodeEnv: NodeEnv;
  level: LogLevel;
  appName: string;
}

const DEFAULT_LEVEL_BY_ENV: Record<NodeEnv, LogLevel> = {
  development: 'debug',
  production: 'info',
  test: 'error',
};

function readLoggerEnv(config: ConfigService): LoggerEnv {
  const nodeEnv = (config.get<string>('NODE_ENV') ?? 'development') as NodeEnv;
  const envLevel = config.get<string>('LOG_LEVEL') as LogLevel | undefined;
  const appName = config.get<string>('APP_NAME') ?? 'codelens-api';
  return {
    nodeEnv,
    level: envLevel ?? DEFAULT_LEVEL_BY_ENV[nodeEnv] ?? 'info',
    appName,
  };
}

export function buildWinstonOptions(
  config: ConfigService,
): WinstonModuleOptions {
  const { nodeEnv, level, appName } = readLoggerEnv(config);
  const isProd = nodeEnv === 'production';
  const isTest = nodeEnv === 'test';

  const consoleFormat = isProd
    ? format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json(),
      )
    : format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        format.errors({ stack: true }),
        format.ms(),
        nestWinstonUtilities.format.nestLike(appName, {
          colors: true,
          prettyPrint: true,
        }),
      );

  return {
    level,
    silent: isTest,
    defaultMeta: { service: appName, env: nodeEnv },
    format: format.combine(format.errors({ stack: true }), format.splat()),
    transports: [
      new transports.Console({
        format: consoleFormat,
        handleExceptions: true,
        handleRejections: true,
      }),
    ],
    exitOnError: false,
  };
}

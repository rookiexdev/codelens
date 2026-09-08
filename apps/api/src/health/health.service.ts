import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type DependencyStatus = 'up' | 'down';

export interface LivenessReport {
  status: 'ok';
  timestamp: string;
  uptimeSeconds: number;
}

export interface ReadinessReport {
  status: 'ok' | 'error';
  timestamp: string;
  uptimeSeconds: number;
  database: DependencyStatus;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  live(): LivenessReport {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  async ready(): Promise<ReadinessReport> {
    const database = await this.checkDatabase();
    return {
      status: database === 'up' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database,
    };
  }

  private async checkDatabase(): Promise<DependencyStatus> {
    try {
      // MongoDB datasource: `ping` is the lightweight liveness command.
      await this.prisma.$runCommandRaw({ ping: 1 });
      return 'up';
    } catch (error) {
      this.logger.error(
        'Database health check failed',
        error instanceof Error ? error.stack : String(error),
      );
      return 'down';
    }
  }
}

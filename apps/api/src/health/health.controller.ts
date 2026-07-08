import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService } from './health.service';
import type { LivenessReport, ReadinessReport } from './health.service';

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  // Liveness: the process is up and serving requests. No dependency checks.
  @Get()
  @HttpCode(HttpStatus.OK)
  live(): LivenessReport {
    return this.healthService.live();
  }

  // Readiness: downstream dependencies (DB) are reachable. 503 if not.
  @Get('ready')
  async ready(): Promise<ReadinessReport> {
    const report = await this.healthService.ready();
    if (report.status !== 'ok') {
      throw new ServiceUnavailableException(report);
    }
    return report;
  }
}

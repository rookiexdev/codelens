import { Global, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BadgesController } from './badges.controller';
import { BadgesCronService } from './badges-cron.service';
import { BadgesService } from './badges.service';
import { BADGE_STRATEGY_PROVIDERS } from './strategies';

/**
 * Global so `BadgesService` can be injected from any future module
 * (Reviews, Users, etc.) without re-importing. Mirrors the
 * `ActivityModule` pattern already in use.
 *
 * `ScheduleModule.forRoot()` is intentionally registered here (not in
 * AppModule) so the cron lifetime tracks the badges feature — disabling
 * the module disables the sweep.
 */
@Global()
@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [BadgesController],
  providers: [BadgesService, BadgesCronService, ...BADGE_STRATEGY_PROVIDERS],
  exports: [BadgesService],
})
export class BadgesModule {}

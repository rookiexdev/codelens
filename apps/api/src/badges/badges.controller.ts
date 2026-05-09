import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import {
  AwardedBadgeView,
  BadgeCatalogEntry,
  BadgesService,
} from './badges.service';

@Controller('badges')
export class BadgesController {
  constructor(private readonly badges: BadgesService) {}

  /**
   * Public catalog of awardable badges. Used by the frontend to render
   * the locked/unlocked grid alongside a user's earned set.
   */
  @Get()
  catalog(): Promise<BadgeCatalogEntry[]> {
    return this.badges.listCatalog();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  myBadges(@CurrentUser() user: AuthUser): Promise<AwardedBadgeView[]> {
    return this.badges.listForUser(user.id);
  }

  /**
   * On-demand re-evaluation for the current user. Cheap to call (each
   * strategy runs a single aggregate query). Useful for a "refresh
   * badges" affordance and for tests.
   */
  @Post('me/evaluate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  evaluateMe(
    @CurrentUser() user: AuthUser,
  ): Promise<{ awarded: AwardedBadgeView[] }> {
    return this.badges
      .evaluateForUser({ userId: user.id, trigger: 'manual_admin' })
      .then((awarded) => ({ awarded }));
  }
}

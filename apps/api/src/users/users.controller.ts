import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ActivityService } from '../activity/activity.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { USER_NOT_DELETED_FILTER } from '../common/soft-delete/filters';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityQueryDto } from './dto/activity-query.dto';
import { ContributionsQueryDto } from './dto/contributions-query.dto';
import { ReplaceSocialLinksDto } from './dto/social-links.dto';
import { SetStatusDto } from './dto/status.dto';
import { UpdateTechStackDto } from './dto/tech-stack.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  ActivityFeedItem,
  PrivateUserProfile,
  PublicUserProfile,
  SocialLinkView,
  UserStatusView,
} from './interfaces/user-profile.interface';
import { UsersService } from './users.service';

const DEFAULT_CONTRIBUTION_DAYS = 365;
const DEFAULT_ACTIVITY_LIMIT = 10;

@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly activity: ActivityService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser): Promise<PrivateUserProfile> {
    return this.users.getPrivateProfile(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<PrivateUserProfile> {
    return this.users.updateProfile(user.id, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async deleteMe(@CurrentUser() user: AuthUser): Promise<void> {
    await this.users.deleteAccount(user.id);
  }

  @Put('me/social-links')
  @UseGuards(JwtAuthGuard)
  replaceSocialLinks(
    @CurrentUser() user: AuthUser,
    @Body() dto: ReplaceSocialLinksDto,
  ): Promise<SocialLinkView[]> {
    return this.users.replaceSocialLinks(user.id, dto);
  }

  @Put('me/tech-stack')
  @UseGuards(JwtAuthGuard)
  async updateTechStack(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateTechStackDto,
  ): Promise<{ techStack: string[] }> {
    const techStack = await this.users.updateTechStack(user.id, dto);
    return { techStack };
  }

  @Patch('me/status')
  @UseGuards(JwtAuthGuard)
  async setStatus(
    @CurrentUser() user: AuthUser,
    @Body() dto: SetStatusDto,
  ): Promise<{ status: UserStatusView | null }> {
    const status = await this.users.setStatus(user.id, dto);
    return { status };
  }

  @Delete('me/status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async clearStatus(@CurrentUser() user: AuthUser): Promise<void> {
    await this.users.clearStatus(user.id);
  }

  @Get(':username')
  publicProfile(
    @Param('username') username: string,
  ): Promise<PublicUserProfile> {
    return this.users.getPublicProfileByUsername(username);
  }

  @Get(':username/contributions')
  async contributions(
    @Param('username') username: string,
    @Query() query: ContributionsQueryDto,
  ): Promise<{
    from: Date;
    to: Date;
    days: Array<{ day: Date; count: number }>;
    totals: {
      week: number;
      month: number;
      year: number;
      allTime: number;
    };
  }> {
    const userId = await this.resolveUserId(username);
    const to = query.to ?? new Date();
    const from = query.from ?? subDays(to, DEFAULT_CONTRIBUTION_DAYS - 1);
    const [days, totals] = await Promise.all([
      this.activity.getContributions(userId, { from, to }),
      this.activity.getContributionTotals(userId),
    ]);
    return { from, to, days, totals };
  }

  @Get(':username/activity')
  async activityFeed(
    @Param('username') username: string,
    @Query() query: ActivityQueryDto,
  ): Promise<{ items: ActivityFeedItem[]; nextCursor: string | null }> {
    const userId = await this.resolveUserId(username);
    return this.activity.getActivity(userId, {
      limit: query.limit ?? DEFAULT_ACTIVITY_LIMIT,
      cursor: query.cursor,
    });
  }

  private async resolveUserId(username: string): Promise<string> {
    const row = await this.prisma.user.findFirst({
      where: { username, ...USER_NOT_DELETED_FILTER },
      select: { id: true },
    });
    if (!row) throw new NotFoundException('user not found');
    return row.id;
  }
}

function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

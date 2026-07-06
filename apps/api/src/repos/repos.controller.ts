import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ParseEnumPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Provider } from '../../prisma/generated/client';
import { SelectRepoDto } from './dto/select-repo.dto';
import { ReposService } from './repos.service';
import type { Repo, SelectRepoResponse } from './types';

@Controller('repos')
@UseGuards(JwtAuthGuard)
export class ReposController {
  constructor(private readonly repos: ReposService) {}

  @Get()
  listRepos(
    @CurrentUser() user: AuthUser,
    @Query('provider', new ParseEnumPipe(Provider)) provider: Provider,
  ): Promise<Repo[]> {
    return this.repos.listRepos(user.id, provider);
  }

  @Post('select')
  @HttpCode(HttpStatus.OK)
  selectRepo(
    @CurrentUser() user: AuthUser,
    @Body() dto: SelectRepoDto,
  ): SelectRepoResponse {
    return this.repos.selectRepo(user.id, dto);
  }
}

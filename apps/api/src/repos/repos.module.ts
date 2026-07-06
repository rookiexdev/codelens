import { Module } from '@nestjs/common';
import { OAuthModule } from '../oauth/oauth.module';
import { ReposController } from './repos.controller';
import { ReposService } from './repos.service';

@Module({
  imports: [OAuthModule],
  controllers: [ReposController],
  providers: [ReposService],
})
export class ReposModule {}

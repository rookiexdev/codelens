import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsernameGenerator } from './username';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsernameGenerator],
  exports: [UsersService, UsernameGenerator],
})
export class UsersModule {}

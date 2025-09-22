import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { UserProfile } from '../integrations/ports/user.port';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getCurrentUser(): Promise<UserProfile | null> {
    return this.userService.getCurrentUser();
  }
}

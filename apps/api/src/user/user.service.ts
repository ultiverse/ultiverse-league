import { Injectable, Inject } from '@nestjs/common';
import type {
  IUserProvider,
  UserProfile,
} from '../integrations/ports/user.port';
import { USER_PROVIDER } from '../integrations/ports';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_PROVIDER) private readonly userProvider: IUserProvider,
  ) {}

  async getCurrentUser(): Promise<UserProfile | null> {
    return this.userProvider.getCurrentUser();
  }
}

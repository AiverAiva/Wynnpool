import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { UsersService } from '../users/users.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  serializeUser(user: any, done: Function) {
    done(null, user.discordId);
  }

  async deserializeUser(discordId: string, done: Function) {
    const user = await this.usersService.findByDiscordId(discordId);
    done(null, user);
  }
}

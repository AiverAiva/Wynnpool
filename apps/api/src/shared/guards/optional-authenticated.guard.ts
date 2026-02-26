import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class OptionalAuthenticatedGuard implements CanActivate {
  constructor(private jwtService: JwtService, private usersService: UsersService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies['__Secure-wynnpool.session-token'] || req.cookies['wynnpool.session-token'];
    
    if (!token) {
      // No token provided, but that's okay - just continue without user
      return true;
    }

    try {
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      req.user = await this.usersService.findByDiscordId(payload.discordId);
    } catch (e) {
      // Invalid token, but that's okay - just continue without user
    }

    return true;
  }
}

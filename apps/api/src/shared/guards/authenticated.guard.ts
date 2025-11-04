import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  constructor(private jwtService: JwtService, private usersService: UsersService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies['__Secure-wynnpool.session-token'] || req.cookies['wynnpool.session-token'];
    if (!token) throw new UnauthorizedException('No token');
    try {
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      req.user = await this.usersService.findByDiscordId(payload.discordId);
      return !!req.user;
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
// Extend Express Request type to include user
import { User } from '../shared/schemas/user.schema';
declare module 'express' {
  interface Request {
    user?: User | any;
  }
}

@Controller('auth')
export class AuthController {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService
    ) { }

    private getCookieOptions() {
        const isProd = process.env.NODE_ENV === 'production';
        return {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' as const : 'lax' as const,
            path: '/',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            ...(isProd ? { domain: '.wynnpool.com' } : {}),
        };
    }

    private getCookieName() {
        return process.env.NODE_ENV === 'production'
            ? '__Secure-wynnpool.session-token'
            : 'wynnpool.session-token';
    }

    @Get('discord')
    @UseGuards(AuthGuard('discord'))
    async discordLogin() {
        // Handled by passport-discord
    }

    @Get('discord/callback')
    @UseGuards(AuthGuard('discord'))
    async discordCallback(@Req() req: Request, @Res() res: Response) {
        const user = req.user as any;
        await this.usersService.upsertByDiscordId(user.discordId, user.discordProfile, user.accessToken, user.refreshToken);
        // Issue JWT and set as secure, httpOnly cookie
        const token = this.jwtService.sign({ discordId: user.discordId }, { secret: process.env.JWT_SECRET, expiresIn: '30d' });
        res.cookie(this.getCookieName(), token, this.getCookieOptions());
        res.redirect(process.env.FRONTEND_HOME_URL || '/');
    }

    @Get('logout')
    async logout(@Req() req: Request, @Res() res: Response) {
        res.clearCookie(this.getCookieName(), { path: '/' });
        res.json({ success: true });
    }

    @Get('test-cookie')
    async testCookie(@Res() res: Response) {
        res.cookie(this.getCookieName(), 'test-value', this.getCookieOptions());
        res.json({ success: true, message: 'Cookie set' });
    }
}

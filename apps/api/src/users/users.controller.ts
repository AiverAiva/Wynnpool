import { Controller, Get, Req, Res, UseGuards, Param } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { AuthenticatedGuard } from '../auth/authenticated.guard';
import axios from 'axios';
import qs from 'qs';
import { JwtService } from '@nestjs/jwt';

@Controller('user')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService
    ) { }

    private setAuthCookie(res: any, discordId: string) {
        const token = this.jwtService.sign({ discordId }, { secret: process.env.JWT_SECRET, expiresIn: '30d' });
        res.cookie(
            process.env.NODE_ENV === 'production' ? '__Secure-wynnpool.session-token' : 'wynnpool.session-token',
            token,
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/',
                maxAge: 30 * 24 * 60 * 60 * 1000,
                ...(process.env.NODE_ENV === 'production' ? { domain: '.wynnpool.com' } : {}),
            }
        );
    }

    @UseGuards(AuthenticatedGuard)
    @Get('me')
    async getMe(@Req() req: Request, @Res() res: any) {
        const user = req.user as any;
        if (!user || !user.discordId) return user;

        let accessToken = user.accessToken;
        let refreshToken = user.refreshToken;
        let discordProfile = user.discordProfile;
        let roles = user.roles;
        let updated = false;

        // Try to fetch latest profile from Discord
        try {
            if (accessToken) {
                try {
                    const discordRes = await axios.get('https://discord.com/api/users/@me', {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    });
                    discordProfile = discordRes.data;
                    updated = true;
                } catch (err: any) {
                    // If token expired, try to refresh
                    if (refreshToken && err.response && err.response.status === 401) {
                        // Refresh access token
                        const params = {
                            client_id: process.env.DISCORD_CLIENT_ID,
                            client_secret: process.env.DISCORD_CLIENT_SECRET,
                            grant_type: 'refresh_token',
                            refresh_token: refreshToken,
                            redirect_uri: process.env.DISCORD_REDIRECT_URI,
                            scope: 'identify email',
                        };
                        const tokenRes = await axios.post(
                            'https://discord.com/api/oauth2/token',
                            qs.stringify(params),
                            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
                        );
                        accessToken = tokenRes.data.access_token;
                        refreshToken = tokenRes.data.refresh_token;
                        // Fetch profile with new access token
                        const discordRes = await axios.get('https://discord.com/api/users/@me', {
                            headers: { Authorization: `Bearer ${accessToken}` },
                        });
                        discordProfile = discordRes.data;
                        updated = true;
                    }
                }
            }
        } catch (e) {
            // If all fails, just return DB user
        }
        // Update DB if needed
        if (updated) {
            await this.usersService.upsertByDiscordId(user.discordId, discordProfile, accessToken, refreshToken);
        }
        // Sliding expiration: re-set the cookie
        this.setAuthCookie(res, user.discordId);
        return res.json({ ...user, discordProfile, accessToken, refreshToken });
    }

    @UseGuards(AuthenticatedGuard)
    @Get('roles')
    async getRoles(@Req() req: Request) {
        const user = req.user as any;
        // This is a super fast endpoint: just return roles from session
        return { roles: user?.roles || [] };
    }

    @UseGuards(AuthenticatedGuard)
    @Get('me/quick')
    async getDatabaseUser(@Req() req: Request, @Res() res: any) {
        const user = req.user as any;
        // Sliding expiration: re-set the cookie
        this.setAuthCookie(res, user.discordId);
        return res.json(user);
    }
}

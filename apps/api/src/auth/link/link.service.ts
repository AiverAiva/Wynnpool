import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import Redis from 'ioredis';

@Injectable()
export class LinkService {
    constructor(private readonly usersService: UsersService) { }

    /**
     * Verify an OTP code for a given credential. This is a placeholder implementation.
     * In the next step we'll connect to Redis to resolve the OTP mapping.
     */
    async verifyMinecraftLink(credential: string, code: string) {
        if (!credential) throw new BadRequestException('Missing credential')
        if (!code || !/^[0-9]{6}$/.test(code)) throw new BadRequestException('Invalid code')
        // attempt to find a user by id first
        const user = await this.usersService.findById(credential) || await this.usersService.findByDiscordId(credential)
        if (!user) throw new NotFoundException('User not found for provided credential')

        // Connect to Redis
        const redisUrl = process.env.REDIS_URL
        if (!redisUrl) throw new InternalServerErrorException('Redis not configured')

        const redis = new Redis(redisUrl)
        try {
            // Single key format: wynnpool:verify:<code>
            const key = `wynnpool:verify:${code}`
            const exists = await redis.exists(key)
            if (!exists) throw new NotFoundException('OTP code not found or expired')

            const entry = await redis.hgetall(key)
            // expect fields like { '0': uuid, '1': name, '2': expires }
            const uuid = entry['0'] || entry['uuid'] || ''
            const name = entry['1'] || entry['name'] || ''

            if (!uuid || !name) {
                throw new InternalServerErrorException('Malformed OTP entry in Redis')
            }

            // Update user's minecraftProfile
            await this.usersService.updateMinecraftProfile(user.id, { uuid, name })

            // Delete the OTP key so it can't be reused
            await redis.del(key)

            return { success: true, username: name, uuid }
        } finally {
            try { await redis.quit() } catch (e) { /* ignore */ }
        }
    }

    async disconnectMinecraftLink(credential: string) {
        if (!credential) throw new BadRequestException('Missing credential')
        // attempt to find a user by id first
        const user = await this.usersService.findById(credential) || await this.usersService.findByDiscordId(credential)
        if (!user) throw new NotFoundException('User not found for provided credential')

        // Remove minecraftProfile entirely
        await this.usersService.removeMinecraftProfile(user.id)
        return { success: true }
    }
}

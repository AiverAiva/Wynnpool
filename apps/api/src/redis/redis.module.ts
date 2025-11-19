import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';

@Global()
@Module({
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: () => {
                const url = process.env.REDIS_URL;
                if (!url) {
                    throw new Error('REDIS_URL is not set');
                }
                return new Redis(url);
            },
        },
    ],
    exports: ['REDIS_CLIENT'],
})
export class RedisModule { }

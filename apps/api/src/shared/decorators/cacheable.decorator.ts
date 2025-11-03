import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * A custom decorator that caches the result of a method.
 * Example:
 *   @Cacheable('weights', 60 * 60) // cache 1 hour
 */
export function Cacheable(cacheKey: string, ttlMs = 60) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor,
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            // access injected cache manager
            const cacheManager: Cache = this.cache || this[CACHE_MANAGER];

            if (!cacheManager) {
                console.warn(`[Cacheable] CacheManager not found on ${target.constructor.name}`);
                return await originalMethod.apply(this, args);
            }

            const key = `${cacheKey}:${JSON.stringify(args)}`;
            const cached = await cacheManager.get(key);
            if (cached) {
                return cached;
            }

            const result = await originalMethod.apply(this, args);
            await cacheManager.set(key, result, ttlMs);
            return result;
        };

        return descriptor;
    };
}

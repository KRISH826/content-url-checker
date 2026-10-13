import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const globalRedis = globalThis as unknown as { redis?: Redis };

export const redis =
    globalRedis.redis ??
    new Redis(REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true,
    });

if (process.env.NODE_ENV !== "production") globalRedis.redis = redis;

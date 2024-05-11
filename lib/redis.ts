import { Redis } from "@upstash/redis";

export const redis: Redis = Redis.fromEnv();
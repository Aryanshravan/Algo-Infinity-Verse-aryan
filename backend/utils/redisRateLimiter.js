import { getClientIdentifier } from '../services/auth.service.js';
import { redisClient, redisAvailable, redisReady } from '../jobs/queue.js';

/**
 * Redis-backed Token Bucket rate limiter
 */
export class RedisTokenBucketLimiter {
  constructor(options = {}) {
    this.capacity = options.capacity || 10;
    this.refillRate = options.refillRate || 1; // tokens per second
    this.keyPrefix = options.keyPrefix || 'ratelimit:';
  }

  async check(key) {
    await redisReady;

    if (!redisAvailable || !redisClient) {
      return { allowed: true, remaining: 1, retryAfter: 0 };
    }

    const redisKey = `${this.keyPrefix}${key}`;
    const now = Date.now();
    const refillRateMs = this.refillRate / 1000;

    const luaScript = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refill_rate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local requested = 1

      local bucket = redis.call("HMGET", key, "tokens", "last_refill")
      local tokens = tonumber(bucket[1])
      local last_refill = tonumber(bucket[2])

      if tokens == nil then
        tokens = capacity
        last_refill = now
      else
        local elapsed = now - last_refill
        local refill_amount = elapsed * refill_rate
        tokens = math.min(capacity, tokens + refill_amount)
        last_refill = now
      end

      local allowed = 0
      if tokens >= requested then
        tokens = tokens - requested
        allowed = 1
      end

      redis.call("HMSET", key, "tokens", tostring(tokens), "last_refill", tostring(last_refill))
      
      local ttl = math.ceil(capacity / (refill_rate * 1000)) + 60
      redis.call("EXPIRE", key, ttl)

      return { allowed, tostring(tokens) }
    `;

    try {
      const result = await redisClient.eval(
        luaScript,
        1,
        redisKey,
        this.capacity,
        refillRateMs,
        now
      );

      const allowed = result[0] === 1;
      const tokens = parseFloat(result[1]);
      const retryAfter = allowed ? 0 : Math.ceil(1 / this.refillRate);

      return { allowed, remaining: tokens, retryAfter };
    } catch (error) {
      console.error('Redis Rate Limiter Error:', error);
      return { allowed: true, remaining: 1, retryAfter: 0 };
    }
  }
}

export async function applyRedisRateLimit(
  req,
  res,
  limiter,
  errorMessage = 'Too many attempts. Please try again later.'
) {
  const key = getClientIdentifier(req);
  const checkResult = await limiter.check(key);

  if (!checkResult.allowed) {
    res.writeHead(429, {
      'Content-Type': 'application/json; charset=utf-8',
      'Retry-After': String(checkResult.retryAfter),
    });
    res.end(
      JSON.stringify({
        error: errorMessage,
        retryAfter: checkResult.retryAfter,
      })
    );
    return false;
  }
  return true;
}

// Code Execution: e.g. 10 requests per minute
export const codeExecutionRedisLimiter = new RedisTokenBucketLimiter({
  capacity: 10,
  refillRate: 10 / 60,
  keyPrefix: 'ratelimit:exec:',
});

// Repository Analysis: e.g. 5 requests per minute
export const repoAnalysisRedisLimiter = new RedisTokenBucketLimiter({
  capacity: 5,
  refillRate: 5 / 60,
  keyPrefix: 'ratelimit:repo:',
});

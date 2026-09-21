import { randomUUID } from 'node:crypto'
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { IHealthChecker } from '@mediconcen_coding_test/contracts'
import { Redis } from 'ioredis'
import type { RedisEnv } from './redis-env.schema.ts'

const UNLOCK_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
`

@Injectable()
export class RedisService
  implements OnModuleInit, OnModuleDestroy, IHealthChecker
{
  private readonly logger = new Logger(RedisService.name)
  private readonly client: Redis
  private available = false

  constructor(configService: ConfigService<RedisEnv, true>) {
    const redis = configService.get('redis', { infer: true })

    this.client = new Redis({
      host: redis.host,
      port: redis.port,
      password: redis.password === '' ? undefined : redis.password,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    })

    this.client.on('error', (error: Error) => {
      this.available = false
      this.logger.warn(`Redis error: ${error.message}`)
    })
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect()
      this.available = true
    } catch (error) {
      this.available = false
      const message = error instanceof Error ? error.message : 'unknown error'
      this.logger.warn(
        `Redis unavailable, continuing without cache: ${message}`,
      )
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.status !== 'end') {
      await this.client.quit()
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.available) {
      return null
    }

    try {
      return await this.client.get(key)
    } catch (error) {
      this.available = false
      const message = error instanceof Error ? error.message : 'unknown error'
      this.logger.warn(`Redis get failed: ${message}`)
      return null
    }
  }

  async set(key: string, value: string): Promise<void> {
    if (!this.available) {
      return
    }

    try {
      await this.client.set(key, value)
    } catch (error) {
      this.available = false
      const message = error instanceof Error ? error.message : 'unknown error'
      this.logger.warn(`Redis set failed: ${message}`)
    }
  }

  isAvailable(): boolean {
    return this.available
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping()
      this.available = result === 'PONG'
      return this.available
    } catch {
      this.available = false
      return false
    }
  }

  async tryLock(key: string, ttlMs: number): Promise<string | null> {
    if (!this.available) {
      return null
    }

    const token = randomUUID()

    try {
      const result = await this.client.set(key, token, 'PX', ttlMs, 'NX')
      return result === 'OK' ? token : null
    } catch (error) {
      this.available = false
      const message = error instanceof Error ? error.message : 'unknown error'
      this.logger.warn(`Redis tryLock failed: ${message}`)
      return null
    }
  }

  async releaseLock(key: string, token: string): Promise<void> {
    if (!this.available) {
      return
    }

    try {
      await this.client.eval(UNLOCK_SCRIPT, 1, key, token)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      this.logger.warn(`Redis releaseLock failed: ${message}`)
    }
  }
}

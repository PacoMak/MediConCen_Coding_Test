import { type INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import {
  PrismaService,
  RedisService,
} from '@mediconcen_coding_test/backend-common'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HealthController } from './health.controller.js'

describe('GET /health', () => {
  const database = { ping: vi.fn() }
  const redis = { ping: vi.fn() }
  const configService = {
    get: vi.fn(() => 'LOCAL'),
  }

  let app: INestApplication

  beforeEach(async () => {
    vi.clearAllMocks()
    configService.get.mockReturnValue('LOCAL')

    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: database },
        { provide: RedisService, useValue: redis },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile()

    app = moduleRef.createNestApplication({ logger: false })
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it('returns 200 with env and ok when database and redis are up', async () => {
    database.ping.mockResolvedValue(true)
    redis.ping.mockResolvedValue(true)

    const response = await request(app.getHttpServer()).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      env: 'LOCAL',
      status: 'ok',
      database: 'ok',
      redis: 'ok',
    })
  })

  it('returns 200 with status error when a dependency is down', async () => {
    database.ping.mockResolvedValue(true)
    redis.ping.mockResolvedValue(false)

    const response = await request(app.getHttpServer()).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      env: 'LOCAL',
      status: 'error',
      database: 'ok',
      redis: 'error',
    })
  })
})

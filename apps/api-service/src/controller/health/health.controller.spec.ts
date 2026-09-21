import { ConfigService } from '@nestjs/config'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Environment } from '../../config/env-schema.js'
import { HealthController } from './health.controller.js'

describe('HealthController', () => {
  const database = {
    ping: vi.fn(),
  }
  const redis = {
    ping: vi.fn(),
  }
  const configService = {
    get: vi.fn(() => 'LOCAL'),
  }

  let controller: HealthController

  beforeEach(() => {
    vi.clearAllMocks()
    configService.get.mockReturnValue('LOCAL')
    controller = new HealthController(
      database,
      redis,
      configService as unknown as ConfigService<Environment, true>,
    )
  })

  it('returns env and ok when database and redis are up', async () => {
    database.ping.mockResolvedValue(true)
    redis.ping.mockResolvedValue(true)

    await expect(controller.getHealth()).resolves.toEqual({
      env: 'LOCAL',
      status: 'ok',
      database: 'ok',
      redis: 'ok',
    })
  })

  it('returns error when redis is down', async () => {
    database.ping.mockResolvedValue(true)
    redis.ping.mockResolvedValue(false)

    await expect(controller.getHealth()).resolves.toEqual({
      env: 'LOCAL',
      status: 'error',
      database: 'ok',
      redis: 'error',
    })
  })

  it('returns error when the database is down', async () => {
    database.ping.mockResolvedValue(false)
    redis.ping.mockResolvedValue(true)

    await expect(controller.getHealth()).resolves.toEqual({
      env: 'LOCAL',
      status: 'error',
      database: 'error',
      redis: 'ok',
    })
  })
})

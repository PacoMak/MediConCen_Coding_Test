import { Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { healthRoutes } from '@mediconcen_coding_test/api-defs'
import {
  PrismaService,
  RedisService,
} from '@mediconcen_coding_test/backend-common'
import type { IHealthChecker } from '@mediconcen_coding_test/contracts'
import type { z } from 'zod'
import type { Environment } from '../../config/env-schema.js'
import {
  ApiController,
  ApiEndpoint,
} from '../../http/api-endpoint.decorator.js'

type GetHealthResponse = z.infer<
  typeof healthRoutes.endpoints.getHealth.schemas.response
>

@ApiController(healthRoutes)
export class HealthController {
  constructor(
    @Inject(PrismaService) private readonly database: IHealthChecker,
    @Inject(RedisService) private readonly redis: IHealthChecker,
    @Inject(ConfigService)
    private readonly configService: ConfigService<Environment, true>,
  ) {}

  @ApiEndpoint(healthRoutes.endpoints.getHealth)
  async getHealth(): Promise<GetHealthResponse> {
    const [databaseUp, redisUp] = await Promise.all([
      this.database.ping(),
      this.redis.ping(),
    ])
    const database = databaseUp ? 'ok' : 'error'
    const redis = redisUp ? 'ok' : 'error'
    const env = this.configService.get('env', { infer: true })
    const status = databaseUp && redisUp ? 'ok' : 'error'

    return { env, status, database, redis }
  }
}

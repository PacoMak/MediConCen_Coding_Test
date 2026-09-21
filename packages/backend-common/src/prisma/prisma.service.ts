import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import type { IHealthChecker } from '@mediconcen_coding_test/contracts'
import { PrismaClient } from '@mediconcen_coding_test/database-schema'
import type { DatabaseEnv } from './database-env.schema.ts'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy, IHealthChecker
{
  private readonly logger = new Logger(PrismaService.name)

  constructor(configService: ConfigService<DatabaseEnv, true>) {
    const database = configService.get('database', { infer: true })

    super({
      adapter: new PrismaMariaDb({
        host: database.server,
        port: database.port,
        user: database.user,
        password: database.password,
        database: database.database,
        allowPublicKeyRetrieval: true,
      }),
    })
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      this.logger.warn(
        `Database unavailable, continuing without a connection: ${message}`,
      )
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect()
    } catch {
      // The client may never have connected.
    }
  }

  async ping(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  }
}

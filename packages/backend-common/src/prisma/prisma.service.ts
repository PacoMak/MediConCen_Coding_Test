import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@mediconcen_coding_test/database-schema'
import type { DatabaseEnv } from './database-env.schema.ts'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
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
    await this.$connect()
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
  }
}

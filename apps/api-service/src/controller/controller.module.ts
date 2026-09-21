import { Module } from '@nestjs/common'
import { UserIdentityModule } from '@mediconcen_coding_test/backend-application-service'
import {
  PrismaModule,
  RedisModule,
} from '@mediconcen_coding_test/backend-common'
import { HealthController } from './health/health.controller.js'
import { UserIdentityController } from './user-identity/user-identity.controller.js'

@Module({
  imports: [UserIdentityModule, PrismaModule, RedisModule],
  controllers: [HealthController, UserIdentityController],
})
export class ControllerModule {}

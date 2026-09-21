import { Module } from '@nestjs/common'
import { UserIdentityModule } from '@mediconcen_coding_test/backend-application-service'
import { ConfigModule } from './config/config.module.js'
import { UserIdentityController } from './user-identity/user-identity.controller.js'

@Module({
  imports: [ConfigModule, UserIdentityModule],
  controllers: [UserIdentityController],
})
export class AppModule {}

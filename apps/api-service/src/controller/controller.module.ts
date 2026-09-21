import { Module } from '@nestjs/common'
import { UserIdentityModule } from '@mediconcen_coding_test/backend-application-service'
import { UserIdentityController } from './user-identity/user-identity.controller.js'

@Module({
  imports: [UserIdentityModule],
  controllers: [UserIdentityController],
})
export class ControllerModule {}

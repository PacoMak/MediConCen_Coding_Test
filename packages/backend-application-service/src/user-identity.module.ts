import { Module } from '@nestjs/common'
import {
  CurrentActorProviderModule,
  RedisModule,
} from '@mediconcen_coding_test/backend-common'
import { DatabaseModule } from '@mediconcen_coding_test/database-repository'
import { UserIdentityService } from './user-identity.service.ts'

@Module({
  imports: [CurrentActorProviderModule, DatabaseModule, RedisModule],
  providers: [UserIdentityService],
  exports: [UserIdentityService],
})
export class UserIdentityModule {}

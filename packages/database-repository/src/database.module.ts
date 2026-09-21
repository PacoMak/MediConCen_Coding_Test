import { Module } from '@nestjs/common'
import { PrismaModule } from '@mediconcen_coding_test/backend-common'
import { USER_IDENTITY_REPOSITORY } from '@mediconcen_coding_test/contracts'
import { UserIdentityRepository } from './user-identity.repository.ts'

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: USER_IDENTITY_REPOSITORY,
      useClass: UserIdentityRepository,
    },
  ],
  exports: [USER_IDENTITY_REPOSITORY],
})
export class DatabaseModule {}

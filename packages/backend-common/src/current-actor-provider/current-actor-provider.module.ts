import { Module } from '@nestjs/common'
import { ClsModule } from '../cls/cls.module.ts'
import { CurrentActorProvider } from './current-actor-provider.ts'

@Module({
  imports: [ClsModule],
  providers: [CurrentActorProvider],
  exports: [CurrentActorProvider],
})
export class CurrentActorProviderModule {}

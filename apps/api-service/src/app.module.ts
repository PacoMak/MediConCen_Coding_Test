import { Module } from '@nestjs/common'
import { ConfigModule } from './config/config.module.js'
import { ControllerModule } from './controller/controller.module.js'

@Module({
  imports: [ConfigModule, ControllerModule],
})
export class AppModule {}

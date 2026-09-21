import { randomUUID } from 'node:crypto'
import type { IncomingMessage } from 'node:http'
import { Module } from '@nestjs/common'
import { ClsModule as NestClsModule } from 'nestjs-cls'
import { requestIdFromHeader } from './request-id.ts'

@Module({
  imports: [
    NestClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: IncomingMessage) =>
          requestIdFromHeader(req.headers['x-request-id']) ?? randomUUID(),
      },
    }),
  ],
  exports: [NestClsModule],
})
export class ClsModule {}

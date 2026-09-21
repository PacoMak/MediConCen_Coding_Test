import { Injectable } from '@nestjs/common'
import { ClsService } from 'nestjs-cls'

@Injectable()
export class CurrentActorProvider {
  constructor(private readonly cls: ClsService) {}

  getId(): string {
    const id = this.cls.getId()
    if (!id) {
      throw new Error('Request context id is not set')
    }
    return id
  }
}

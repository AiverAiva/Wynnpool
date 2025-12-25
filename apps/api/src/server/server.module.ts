import { Module } from '@nestjs/common';
import { ServerService } from './server.service';
import { ServerController } from './server.controller';

@Module({
  providers: [ServerService],
  controllers: [ServerController],
})
export class ServerModule {}

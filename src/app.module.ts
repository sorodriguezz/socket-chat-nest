import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { SocketGateway } from './modules/socket.gateway';

@Module({
  imports: [],
  controllers: [],
  providers: [AppService, SocketGateway],
})
export class AppModule {}

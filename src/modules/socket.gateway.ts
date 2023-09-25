import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

@WebSocketGateway({ cors: true })
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  afterInit(server: Server) {
    console.log('Socket Initialized!');
  }

  handleConnection(client: Socket, ...args: any[]) {
    // console.log(`Client connected: ${client.id}`);
    this.server.emit('userConnected', {
      userId: client.id,
      message: 'Usuario conectado',
    });
  }

  handleDisconnect(client: Socket) {
    // console.log(`Client disconnected: ${client.id}`);
    this.server.emit('userDisconnected', {
      userId: client.id,
      message: 'Usuario desconectado',
    });
  }

  @SubscribeMessage('leaveRoom')
  handleRoomLeave(client: Socket, data: any) {
    client.leave(data.roomName);
    this.server
      .to(data.roomName)
      .emit('userLeftRoom', `${data.nameUser} ha dejado la sala.`);
  }

  @SubscribeMessage('createRoom')
  handleCreateRoom(client: Socket): void {
    const roomId = this.generateUUID();
    client.join(roomId);
    client.emit('roomCreated', roomId);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    client: Socket,
    data: { roomId: string; userName: string },
  ): void {
    client.join(data.roomId);
    // Notificar a todos en la sala (excepto al emisor) que un nuevo usuario se ha unido
    client
      .to(data.roomId)
      .emit('userJoinedRoom', `${data.userName} se ha unido a la sala.`);
  }

  @SubscribeMessage('sendMessage')
  handleChatMessage(
    client: Socket,
    payload: { roomId: string; message: string; sender: string },
  ) {
    const date = new Date();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    const formattedTime = `${hours}:${minutes}`;
    this.server.to(payload.roomId).emit('receiveMessage', {
      sender: `${formattedTime} | ${payload.sender}`,
      text: payload.message,
    });
  }

  private generateUUID(): string {
    return uuidv4();
  }
}

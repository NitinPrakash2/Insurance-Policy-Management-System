import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('EventsGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to real-time stream: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from real-time stream: ${client.id}`);
  }

  @SubscribeMessage('join_workspace')
  handleJoinWorkspace(client: Socket, payload: { companyId: string }) {
    if (payload?.companyId) {
      client.join(`workspace_${payload.companyId}`);
      this.logger.log(`Socket ${client.id} joined workspace_${payload.companyId}`);
      return { status: 'joined', workspace: payload.companyId };
    }
  }

  // Broadcast event to a specific company workspace
  broadcastToWorkspace(companyId: string, event: string, data: any) {
    if (this.server) {
      this.logger.log(`📡 [WS] Broadcast '${event}' to workspace_${companyId}`);
      this.server.to(`workspace_${companyId}`).emit(event, data);
      // Also broadcast globally so Super Admin can observe platform activity live
      this.server.emit('platform_activity', { companyId, event, data, timestamp: new Date() });
    }
  }

  // Broadcast platform-level event (to Super Admin and all workspaces)
  broadcastPlatform(event: string, data: any) {
    if (this.server) {
      this.logger.log(`🌐 [WS] Broadcast '${event}' to all connected clients`);
      this.server.emit(event, data);
    }
  }
}

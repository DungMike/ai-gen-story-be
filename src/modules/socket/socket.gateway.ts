import { 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayConnection, 
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SocketService } from './socket.service';

interface AuthenticatedSocket extends Socket {
  data: {
    user: any;
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocketGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly socketService: SocketService,
  ) {}

  afterInit(server: Server) {
    // Wait a bit for server to be fully initialized
    setTimeout(() => {
      this.socketService.setServer(server);
      this.logger.log('SocketGateway initialized and server set in SocketService');
      
      // Log server status
      this.logger.log(`Server sockets available: ${!!server.sockets}`);
      this.logger.log(`Server sockets.sockets available: ${!!server.sockets.sockets}`);
    }, 100);
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.query.token as string;
      
      if (!token) {
        throw new UnauthorizedException('Token is required');
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
      });
      
      client.data.user = payload;
      
      // Register client with socket service
      await this.socketService.registerClient(client.id, payload);
      
      this.logger.log(`Client connected: ${client.id}, User: ${payload.sub}`);
    } catch (error) {
      this.logger.error(`Connection failed: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.socketService.unregisterClient(client.id);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('pong', { timestamp: Date.now() });
  }

  @SubscribeMessage('get-user-info')
  handleGetUserInfo(@ConnectedSocket() client: AuthenticatedSocket) {
    if (client.data.user) {
      client.emit('user-info', {
        userId: client.data.user.sub,
        role: client.data.user.role
      });
    }
  }
} 
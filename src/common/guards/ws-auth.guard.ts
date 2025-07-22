import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UserSessionRepository } from '../../database/repositories/user-session.repository';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private userSessionRepository: UserSessionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const token = this.extractTokenFromSocket(client);
      
      if (!token) {
        throw new WsException('Access token required');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
      });

      // Check if session exists and is active
      const session = await this.userSessionRepository.findByToken(token);
      if (!session || !session.isActive) {
        throw new WsException('Invalid session');
      }

      // Attach user to socket
      client.data.user = payload;
      return true;
    } catch (error) {
      throw new WsException('Invalid access token');
    }
  }

  private extractTokenFromSocket(client: Socket): string | undefined {
    // Check auth object first
    const authToken = client.handshake.auth.token;
    if (authToken) {
      return authToken.startsWith('Bearer ') ? authToken.substring(7) : authToken;
    }

    // Check headers
    const headerToken = client.handshake.headers.authorization;
    if (headerToken && headerToken.startsWith('Bearer ')) {
      return headerToken.substring(7);
    }

    // Check query parameters
    const queryToken = client.handshake.query.token as string;
    if (queryToken) {
      return queryToken.startsWith('Bearer ') ? queryToken.substring(7) : queryToken;
    }

    return undefined;
  }
} 
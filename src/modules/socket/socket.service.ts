import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

interface ClientInfo {
  userId: string;
  role: string;
  connectedAt: Date;
}

@Injectable()
export class SocketService {
  private readonly logger = new Logger(SocketService.name);
  private clients = new Map<string, ClientInfo>();
  private server: Server;

  setServer(server: Server) {
    this.server = server;
    this.logger.log('SocketService: Server instance set');
  }

  isServerReady(): boolean {
    return !!(this.server && 
           this.server.sockets && 
           this.server.sockets.sockets);
  }

  logServerStatus(): void {
    this.logger.log('=== DETAILED SERVER STATUS ===');
    this.logger.log(`Server instance: ${!!this.server}`);
    
    if (this.server) {
      this.logger.log(`Server sockets: ${!!this.server.sockets}`);
      this.logger.log(`Server sockets.sockets: ${!!this.server.sockets.sockets}`);
      
      if (this.server.sockets && this.server.sockets.sockets) {
        this.logger.log(`Connected sockets count: ${this.server.sockets.sockets.size}`);
        this.logger.log(`Socket IDs: ${Array.from(this.server.sockets.sockets.keys()).join(', ')}`);
      }
    }
    
    this.logger.log(`Server ready: ${this.isServerReady()}`);
    this.logger.log('================================');
  }

  async registerClient(clientId: string, userPayload: any): Promise<void> {
    this.clients.set(clientId, {
      userId: userPayload.sub,
      role: userPayload.role,
      connectedAt: new Date(),
    });
    
    this.logger.log(`Registered client: ${clientId} for user: ${userPayload.sub}`);
  }

  unregisterClient(clientId: string): void {
    this.clients.delete(clientId);
    this.logger.log(`Unregistered client: ${clientId}`);
  }

  getClientInfo(clientId: string): ClientInfo | undefined {
    return this.clients.get(clientId);
  }

  getConnectedClients(): Map<string, ClientInfo> {
    return this.clients;
  }

  getClientsByUserId(userId: string): string[] {
    const clientIds: string[] = [];
    for (const [clientId, info] of this.clients.entries()) {
      if (info.userId === userId) {
        clientIds.push(clientId);
      }
    }
    return clientIds;
  }

  // Room management
  async joinRoom(clientId: string, roomName: string): Promise<void> {
    // Wait for server to be ready
    const serverReady = await this.waitForServerReady();
    if (!serverReady) {
      this.logger.error('SocketService: Server is not ready after waiting!');
      throw new Error('Server is not ready after timeout');
    }
    
    const socket = this.server.sockets.sockets.get(clientId);
    if (socket) {
      await socket.join(roomName);
      this.logger.log(`Client ${clientId} joined room: ${roomName}`);
    } else {
      this.logger.warn(`Socket not found for clientId: ${clientId}`);
      this.logger.warn(`Available sockets: ${Array.from(this.server.sockets.sockets.keys()).join(', ')}`);
    }
  }

  async leaveRoom(clientId: string, roomName: string): Promise<void> {
    if (!this.server) {
      this.logger.error('SocketService: Server instance is not set!');
      return;
    }
    
    const socket = this.server.sockets.sockets.get(clientId);
    if (socket) {
      await socket.leave(roomName);
      this.logger.log(`Client ${clientId} left room: ${roomName}`);
    }
  }

  // Emit to specific room
  emitToRoom(roomName: string, event: string, data: any): void {
    if (!this.server) {
      this.logger.error('SocketService: Server instance is not set!');
      return;
    }
    
    this.server.to(roomName).emit(event, data);
    this.logger.log(`Emitted ${event} to room: ${roomName}`);
  }

  // Emit to specific client
  emitToClient(clientId: string, event: string, data: any): void {
    if (!this.server) {
      this.logger.error('SocketService: Server instance is not set!');
      return;
    }
    
    const socket = this.server.sockets.sockets.get(clientId);
    if (socket) {
      socket.emit(event, data);
      this.logger.log(`Emitted ${event} to client: ${clientId}`);
    }
  }

  // Emit to all clients of a user
  emitToUser(userId: string, event: string, data: any): void {
    const clientIds = this.getClientsByUserId(userId);
    clientIds.forEach(clientId => {
      this.emitToClient(clientId, event, data);
    });
  }

  // Broadcast to all connected clients
  broadcast(event: string, data: any): void {
    if (!this.server) {
      this.logger.error('SocketService: Server instance is not set!');
      return;
    }
    
    this.server.emit(event, data);
    this.logger.log(`Broadcasted ${event} to all clients`);
  }

  // Get all rooms
  getAllRooms(): Map<string, Set<string>> {
    if (!this.server) {
      this.logger.error('SocketService: Server instance is not set!');
      return new Map();
    }
    return this.server.sockets.adapter.rooms;
  }

  // Get rooms with client count
  getRoomsWithClientCount(): { roomName: string; clientCount: number }[] {
    if (!this.server) {
      this.logger.error('SocketService: Server instance is not set!');
      return [];
    }

    const rooms: { roomName: string; clientCount: number }[] = [];
    for (const [roomName, clients] of this.server.sockets.adapter.rooms.entries()) {
      // Skip socket IDs (individual clients)
      if (!clients.has(roomName)) {
        rooms.push({
          roomName,
          clientCount: clients.size
        });
      }
    }
    return rooms;
  }

  // Get clients in a specific room
  getClientsInRoom(roomName: string): string[] {
    if (!this.server) {
      this.logger.error('SocketService: Server instance is not set!');
      return [];
    }

    const room = this.server.sockets.adapter.rooms.get(roomName);
    if (!room) {
      return [];
    }

    return Array.from(room);
  }

  // Get room information
  getRoomInfo(roomName: string): { roomName: string; clientCount: number; clients: string[] } | null {
    if (!this.server) {
      this.logger.error('SocketService: Server instance is not set!');
      return null;
    }

    const room = this.server.sockets.adapter.rooms.get(roomName);
    if (!room) {
      return null;
    }

    return {
      roomName,
      clientCount: room.size,
      clients: Array.from(room)
    };
  }

  // Check if room exists
  roomExists(roomName: string): boolean {
    if (!this.server) {
      return false;
    }
    return this.server.sockets.adapter.rooms.has(roomName);
  }

  // Get all story rooms
  getStoryRooms(): { roomName: string; clientCount: number; storyId: string }[] {
    const allRooms = this.getRoomsWithClientCount();
    return allRooms
      .filter(room => room.roomName.startsWith('story-'))
      .map(room => ({
        ...room,
        storyId: room.roomName.replace('story-', '')
      }));
  }

  // Get all audio rooms
  getAudioRooms(): { roomName: string; clientCount: number; storyId: string }[] {
    const allRooms = this.getRoomsWithClientCount();
    return allRooms
      .filter(room => room.roomName.startsWith('audio-'))
      .map(room => ({
        ...room,
        storyId: room.roomName.replace('audio-', '')
      }));
  }

  // Get all image rooms
  getImageRooms(): { roomName: string; clientCount: number; storyId: string }[] {
    const allRooms = this.getRoomsWithClientCount();
    return allRooms
      .filter(room => room.roomName.startsWith('image-'))
      .map(room => ({
        ...room,
        storyId: room.roomName.replace('image-', '')
      }));
  }

  async waitForServerReady(maxWaitMs: number = 5000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
      if (this.isServerReady()) {
        this.logger.log('Server is ready!');
        return true;
      }
      
      this.logger.log('Waiting for server to be ready...');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.logger.error('Server not ready after timeout');
    return false;
  }
} 
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';

interface WsJwtPayload {
  userId: string;
  companyId: string;
  role: string;
  email: string;
}

@Injectable()
@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private readonly userConnections = new Map<string, Set<string>>();
  private readonly socketUserMap = new Map<string, WsJwtPayload>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers?.authorization?.replace('Bearer ', '') as string);

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<WsJwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Store connection mapping
      this.socketUserMap.set(client.id, payload);

      if (!this.userConnections.has(payload.userId)) {
        this.userConnections.set(payload.userId, new Set());
      }
      this.userConnections.get(payload.userId)!.add(client.id);

      // Join user-specific and company-specific rooms
      await client.join(`user:${payload.userId}`);
      await client.join(`company:${payload.companyId}`);

      this.logger.log(
        `Client ${client.id} connected as user ${payload.userId} (company: ${payload.companyId})`,
      );

      // Send connection acknowledgment
      client.emit('connected', {
        message: 'WebSocket connected successfully',
        userId: payload.userId,
      });
    } catch (error: any) {
      this.logger.warn(`Client ${client.id} auth failed: ${error.message}`);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const payload = this.socketUserMap.get(client.id);
    if (payload) {
      const connections = this.userConnections.get(payload.userId);
      if (connections) {
        connections.delete(client.id);
        if (connections.size === 0) {
          this.userConnections.delete(payload.userId);
        }
      }
      this.socketUserMap.delete(client.id);
      this.logger.log(`Client ${client.id} disconnected (user: ${payload.userId})`);
    }
  }

  /**
   * Send event to a specific user (all their connected tabs)
   */
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Send event to all users in a company
   */
  sendToCompany(companyId: string, event: string, data: any) {
    this.server.to(`company:${companyId}`).emit(event, data);
  }

  /**
   * Get number of connected users
   */
  getConnectedUserCount(): number {
    return this.userConnections.size;
  }

  // ── Event Listeners ──────────────────────────────────────────

  @OnEvent('notification.created')
  handleNotificationCreated(payload: { userId: string; notification: any }) {
    this.sendToUser(payload.userId, 'notification:new', payload.notification);
  }

  @OnEvent('leave.applied')
  handleLeaveApplied(payload: { companyId: string; [key: string]: any }) {
    this.sendToCompany(payload.companyId, 'leave:applied', payload);
  }

  @OnEvent('leave.approved')
  handleLeaveApproved(payload: { companyId: string; userId?: string; [key: string]: any }) {
    if (payload.userId) {
      this.sendToUser(payload.userId, 'leave:approved', payload);
    }
    this.sendToCompany(payload.companyId, 'leave:updated', payload);
  }

  @OnEvent('leave.rejected')
  handleLeaveRejected(payload: { companyId: string; userId?: string; [key: string]: any }) {
    if (payload.userId) {
      this.sendToUser(payload.userId, 'leave:rejected', payload);
    }
    this.sendToCompany(payload.companyId, 'leave:updated', payload);
  }

  @OnEvent('attendance.marked')
  handleAttendanceMarked(payload: { companyId: string; [key: string]: any }) {
    this.sendToCompany(payload.companyId, 'attendance:marked', payload);
  }

  @OnEvent('workflow.step_completed')
  handleWorkflowStepCompleted(payload: { companyId: string; userId?: string; [key: string]: any }) {
    if (payload.userId) {
      this.sendToUser(payload.userId, 'workflow:step_completed', payload);
    }
    this.sendToCompany(payload.companyId, 'workflow:updated', payload);
  }

  @OnEvent('expense.submitted')
  handleExpenseSubmitted(payload: { companyId: string; [key: string]: any }) {
    this.sendToCompany(payload.companyId, 'expense:submitted', payload);
  }

  @OnEvent('expense.approved')
  handleExpenseApproved(payload: { companyId: string; userId?: string; [key: string]: any }) {
    if (payload.userId) {
      this.sendToUser(payload.userId, 'expense:approved', payload);
    }
    this.sendToCompany(payload.companyId, 'expense:updated', payload);
  }
}

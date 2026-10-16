import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private currentCompanyId: string | null = null;

  connect() {
    if (this.socket && this.socket.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('⚡ Connected to Broker Real-Time WebSocket stream:', this.socket?.id);
      if (this.currentCompanyId) {
        this.joinWorkspace(this.currentCompanyId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('⚡ Disconnected from Real-Time WebSocket stream');
    });

    return this.socket;
  }

  joinWorkspace(companyId: string) {
    this.currentCompanyId = companyId;
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_workspace', { companyId });
      console.log(`Joined real-time room for workspace: ${companyId}`);
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.on(event, callback);
    return () => {
      this.socket?.off(event, callback);
    };
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();

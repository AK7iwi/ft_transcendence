const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({
      server,
      path: '/ws'
    });

    this.clients = new Map();        // clientId → ws
    this.onlineUsers = new Map();    // userId → ws

    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws);

      console.log(`✅ Client connected: ${clientId}`);

      ws.send(JSON.stringify({
        type: 'connection',
        clientId,
        message: 'Connected to secure WebSocket server'
      }));

      ws.on('message', (rawMessage) => {
        try {
          const data = JSON.parse(rawMessage);
          this.handleMessage(clientId, ws, data);
        } catch (err) {
          console.error('❌ Invalid JSON message:', err);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(clientId, ws);
      });

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.isAlive = true;
    });

    // Heartbeat
    setInterval(() => {
      for (const [clientId, ws] of this.clients.entries()) {
        if (!ws.isAlive) {
          console.log(`⚠️ Terminating stale client: ${clientId}`);
          ws.terminate();
          this.handleDisconnect(clientId, ws);
        } else {
          ws.isAlive = false;
          ws.ping();
        }
      }
    }, 30000);
  }

  generateClientId() {
    return Math.random().toString(36).substring(2, 15);
  }

  handleMessage(clientId, ws, data) {
    switch (data.type) {
      case 'auth':
        this.handleAuth(clientId, ws, data.token);
        break;
      case 'chat':
        this.handleChatMessage(clientId, data.payload);
        break;
      case 'game':
        this.handleGameMessage(clientId, data.payload);
        break;
      case 'tournament':
        this.handleTournamentMessage(clientId, data.payload);
        break;
      default:
        console.warn(`⚠️ Unknown message type: ${data.type}`);
        this.sendToClient(clientId, {
          type: 'error',
          message: `Unknown message type: ${data.type}`
        });
    }
  }

  handleAuth(clientId, ws, token) {
    if (!token) {
      return this.sendToClient(clientId, { type: 'error', message: 'Missing token' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      ws.userId = decoded.id;
      this.onlineUsers.set(decoded.id, ws);
      console.log(`🔓 Authenticated user ${decoded.id}`);

      this.sendToClient(clientId, {
        type: 'auth-success',
        userId: decoded.id
      });
      this.broadcast({
  type: 'user-status',
  userId: decoded.id,
  status: 'online'
});
    } catch (err) {
      console.error('❌ Invalid token:', err.message);
      this.sendToClient(clientId, { type: 'error', message: 'Invalid token' });
      ws.close();
    }
  }

  handleDisconnect(clientId, ws) {
    console.log(`❌ Client disconnected: ${clientId}`);
    this.clients.delete(clientId);

    if (ws.userId && this.onlineUsers.has(ws.userId)) {
      this.onlineUsers.delete(ws.userId);
      this.broadcast({
        type: 'user-status',
        userId: ws.userId,
        status: 'offline'
      });
    }
  }

  handleChatMessage(clientId, payload) {
    if (!payload || typeof payload.text !== 'string' || !payload.text.trim()) {
      return this.sendToClient(clientId, {
        type: 'error',
        message: 'Invalid chat message'
      });
    }

    const chatMessage = {
      type: 'chat',
      clientId,
      timestamp: Date.now(),
      data: {
        text: payload.text.trim()
      }
    };

    console.log(`[Chat] ${clientId}: ${payload.text.trim()}`);
    this.broadcast(chatMessage);
  }

  handleGameMessage(clientId, payload) {
    const { action, ...rest } = payload || {};
    switch (action) {
      case 'pause':
        this.broadcast({ type: 'game', data: { action: 'pause', by: clientId } });
        break;
      case 'scoreUpdate':
        this.broadcast({ type: 'game', data: { action: 'scoreUpdate', ...rest } });
        break;
      case 'join':
        this.broadcast({ type: 'game', data: { action: 'playerJoined', clientId } });
        break;
      default:
        console.warn(`[WS] Unknown game action:`, action);
    }
  }

  handleTournamentMessage(clientId, payload) {
    this.broadcast({
      type: 'tournament',
      clientId,
      data: payload
    });
  }

  broadcast(message) {
    const msg = JSON.stringify(message);
    for (const ws of this.clients.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    }
  }

  sendToClient(clientId, message) {
    const ws = this.clients.get(clientId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  getOnlineUserIds() {
    return Array.from(this.onlineUsers.keys());
  }
}

module.exports = WebSocketService;

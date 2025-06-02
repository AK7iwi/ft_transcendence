const WebSocket = require('ws');
const Database = require('better-sqlite3');
const db = new Database('/data/database.sqlite');

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({
      server,
      path: '/ws'
    });

    this.clients = new Map(); // ✅ Added
    this.games = new Map();
    this.gamePlayers = new Map();
    this.onlineUsers = new Map();

    this.setupWebSocket();
  }

  setupWebSocket() {
    console.log('✅ Setting up WebSocket server');
    
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws); // ✅ Store ws with ID
      ws.isAlive = true;

      console.log(`✅ Client connected: ${clientId}`);

      ws.send(JSON.stringify({
        type: 'connection',
        clientId,
        message: 'Connected to secure WebSocket server'
      }));

      ws.on('message', (rawMessage) => {
        try {
          console.log(`client : ${ clientId }`)
          const data = JSON.parse(rawMessage);
          this.handleMessage(clientId, data);
        } catch (err) {
          console.error('❌ Invalid JSON message:', err);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
        }
      });

      ws.on('close', () => {
        console.log(`❌ Client disconnected: ${clientId}`);
        console.log('❌ Client disconnected: user', [...this.gamePlayers.entries()]);
        console.log('❌ Client disconnected. Online users:', [...this.onlineUsers.keys()]);
        this.clients.delete(clientId);
        this.broadcastUserDisconnected(clientId);
      });

      ws.on('pong', () => {
        ws.isAlive = true;
      });
    });
  }

  generateClientId() {
    return Math.random().toString(36).substr(2, 9);
  }

  handleMessage(clientId, data) {
    switch (data.type) {
      case 'chat':
        this.handleChatMessage(clientId, data.payload);
        break;
      case 'auth':
        this.handleAuth(clientId, data.payload);
        break;
      case 'dm':
        this.handleDirectMessage(clientId, data.payload); // 🔧 add this
        break;
      case 'game':
        this.handleGameMessage(clientId, data.payload)
        break;
      default:
        console.warn(`⚠️ Unknown message type: ${data.type}`);
        this.sendToClient(clientId, {
          type: 'error',
          message: `Unknown message type: ${data.type}`
        });
    }
  }
      
  handleAuth(clientId, payload) {
    const token = payload?.token;

    if (!token) {
      return this.sendToClient(clientId, {
        type: 'error',
        message: 'Missing token'
      });
    }

    let userId;
    try {
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (err) {
      return this.sendToClient(clientId, {
        type: 'error',
        message: 'Invalid token'
      });
    }

    const ws = this.clients.get(clientId);
    if (!ws) {
      return this.sendToClient(clientId, {
        type: 'error',
        message: 'WebSocket client not found'
      });
    }

    // ✅ Associate both clientId and userId with the socket
    ws.userId = userId;
    ws.clientId = clientId;

    this.onlineUsers.set(userId, ws);           // ✅ Map userId to socket
    this.clients.set(clientId, ws);             // ✅ Keep clientId → ws mapping

    this.sendToClient(clientId, {
      type: 'auth-success',
      userId
    });

    console.log(`✅ Authenticated client ${clientId} as user ${userId}`);
  }

  handleGameMessage(clientId, payload) {
    const { action, direction, playerId, sessionId } = payload;

    if (action === 'input') {
      console.log(`[Game] Input from ${playerId} (${clientId}) → ${direction}`);
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

  handleDirectMessage(clientId, payload) {

    const { toUserId, text } = payload || {};
    const fromWs = this.clients.get(clientId);
    const fromUserId = fromWs?.userId;

    if (!fromUserId || !toUserId || !text?.trim()) {
      console.warn('[DM] Invalid message:', { fromUserId, toUserId, text });
      return;
    }

    // ✅ Vérification du blocage
    if (isBlocked(fromUserId, toUserId)) {
      console.log(`🚫 Message bloqué : ${fromUserId} est bloqué par ou bloque ${toUserId}`);
      fromWs?.send(JSON.stringify({
        type: 'error',
        message: 'You are blocked or have blocked this user.'
      }));
      return;
    }

    const toWs = this.onlineUsers.get(toUserId);
    const payloadToSend = {
      type: 'dm',
      senderId: fromUserId,
      text: text.trim(),
      timestamp: Date.now()
    };

    if (toWs?.readyState === WebSocket.OPEN) {
      toWs.send(JSON.stringify(payloadToSend));
    }

    if (fromWs?.readyState === WebSocket.OPEN) {
      fromWs.send(JSON.stringify(payloadToSend));
    }

    console.log(`[DM] ${fromUserId} → ${toUserId}: ${text}`);
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
  
  broadcastUserDisconnected(clientId) {
    this.broadcast({
      type: 'disconnection',
      clientId,
      message: 'User disconnected'
    });
  }
}

function isBlocked(senderId, receiverId) {
  const stmt = db.prepare(`
    SELECT 1 FROM blocks 
    WHERE (blocker_id = ? AND blocked_id = ?) 
      OR (blocker_id = ? AND blocked_id = ?)
  `);
  const result = stmt.get(senderId, receiverId, receiverId, senderId);
  return !!result;
}

module.exports = WebSocketService;

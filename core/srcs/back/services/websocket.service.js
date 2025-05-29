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
this.rooms = new Map(); // roomId (hostId) → { host: userId, guest: userId, clients: Set<clientId> }

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
     console.log('[WS SERVER] Message brut reçu :', data);
    switch (data.type) {
      case 'auth':
  this.handleAuth(clientId, ws, data.payload.token);
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
        case 'dm':
  this.handleDirectMessage(clientId, data.payload);
  break;
  case 'invite-pong':
  this.handlePongInvite(clientId, data.payload);
  break;

      default:
        console.warn(`⚠️ Unknown message type: ${data.type}`);
        this.sendToClient(clientId, {
          type: 'error',
          message: `Unknown message type: ${data.type}`
        });
    }
  }

  handlePongInvite(clientId, { toUserId }) {
  const toWs = this.onlineUsers.get(toUserId);
  if (!toWs) return;

  toWs.send(JSON.stringify({
    type: 'pong-invite',
    from: this.clients.get(clientId).userId
  }));
}


handleDirectMessage(clientId, payload) {
  console.log('[WS SERVER] handleDirectMessage payload:', payload);

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

handleAuth(clientId, ws, token) {
  if (!token) {
    return this.sendToClient(clientId, { type: 'error', message: 'Missing token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    ws.userId = decoded.id;
    this.clients.set(clientId, ws); // ✅ FIX CRUCIAL
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
handleJoinGame(clientId, { userId, role }) {
  if (!userId || !role) return;

  const ws = this.clients.get(clientId);
  if (!ws) return;

  const roomId = role === 'host' ? userId : ws.roomId;
  if (!roomId) return;

  // Si host, crée la room
  if (role === 'host') {
    this.rooms.set(userId, {
      host: userId,
      guest: null,
      clients: new Set([clientId])
    });
    ws.roomId = userId;
  } else if (role === 'guest') {
    const room = this.rooms.get(roomId);
    if (room) {
      room.guest = userId;
      room.clients.add(clientId);
      ws.roomId = roomId;

      // Notifie les deux joueurs
      for (const client of room.clients) {
        this.sendToClient(client, {
          type: 'game',
          data: {
            action: 'playerJoined',
            role: client === clientId ? 'guest' : 'host'
          }
        });
      }

      console.log(`[GAME] Guest ${userId} joined room ${roomId}`);
    } else {
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Room not found'
      });
    }
  }
}

handleRejoinGame(clientId, { userId, role }) {
  const roomId = role === 'host' ? userId : this.findRoomByUser(userId);
  if (!roomId) return;

  const ws = this.clients.get(clientId);
  const room = this.rooms.get(roomId);
  if (!room) return;

  ws.roomId = roomId;
  room.clients.add(clientId);

  this.sendToClient(clientId, {
    type: 'game',
    data: {
      action: 'playerJoined',
      role
    }
  });

  console.log(`[GAME] ${role} ${userId} rejoined room ${roomId}`);
}

findRoomByUser(userId) {
  for (const [roomId, room] of this.rooms.entries()) {
    if (room.host === userId || room.guest === userId) {
      return roomId;
    }
  }
  return null;
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
      this.handleJoinGame(clientId, payload);
      break;
    case 'rejoin':
      this.handleRejoinGame(clientId, payload);
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



// Ajout : charger la base de données
const Database = require('better-sqlite3');
const db = new Database('/data/database.sqlite');

// Fonction de vérification de blocage
function isBlocked(senderId, receiverId) {
  const stmt = db.prepare(`
    SELECT 1 FROM blocks 
    WHERE (blocker_id = ? AND blocked_id = ?) 
       OR (blocker_id = ? AND blocked_id = ?)
  `);
  const result = stmt.get(senderId, receiverId, receiverId, senderId);
  return !!result;
}

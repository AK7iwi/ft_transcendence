const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { getUsernameById } = require('../db.js'); // adjust path as needed


class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({
      server,
      path: '/ws'
    });

    this.clients = new Map();       // clientId → ws
    this.onlineUsers = new Map();   // userId → ws
this.rooms = new Map(); // roomId → { hostId, guestId, clients: Set }
    this.presence = Array(20).fill(0);

    this.setupWebSocket();
  }

  setupWebSocket() {
    console.log('[WS SERVER] WebSocket server initialized with path /ws');
    this.sendToGameClient('hello');
    this.wss.on('connection', (ws) => {
      console.log('here? \'connection\'');
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws);

      console.log(`✅ Client connected: ${clientId}`);
      
      ws.send(JSON.stringify({
        type: 'connection',
        clientId,
        message: 'Connected to secure WebSocket server'
      }));

      ws.on('message', (rawMessage) => {
        console.log('here? \'message\'');
        try {
          console.log('[SERVER] Received raw message string:', rawMessage);
          const data = JSON.parse(rawMessage);
          this.handleMessage(clientId, ws, data);
        } catch (err) {
          console.error('❌ Invalid JSON message:', err);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
        }
      });

      ws.on('close', () => {
  const clientInfo = this.clients.get(clientId);
  const wsUserId = clientInfo?.userId;
  const roomId = 'pong-room';

  if (this.rooms.has(roomId)) {
    const room = this.rooms.get(roomId);
    room.clients.delete(clientId);

    if (room.hostId === wsUserId) {
      room.hostId = null;
    } else if (room.guestId === wsUserId) {
      room.guestId = null;
    }

    if (room.clients.size === 0) {
      this.rooms.delete(roomId); // nettoyage complet si vide
    }
  }

  this.clients.delete(clientId);
});



      ws.on('pong', () => {
        console.log('here? \'pong\'');
        ws.isAlive = true;
      });
      console.log('here?');
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

  handlePlayerJoin(userId) {
    let role;
    console.log(`in handleplayerJoin: userId = ${userId}`);
    if (this.roles.hostId === userId || !this.roles.hostId) {
      this.roles.hostId = userId;
      role = 'host';
      console.log('------------- HOST');
    } else if (this.roles.guestId === userId || !this.roles.guestId) {
      this.roles.guestId = userId;
      role = 'guest';
      console.log('------------- GUEST');
    } else {
      role = 'noob';
      console.warn(`🔴 Room full. Host: ${this.roles.hostId} | Guest: ${this.roles.guestId}`);
      console.log('------------- NOOB');
    }

    console.log('------------- SENDTOCLIENT');
    this.sendToGameClient(userId, {
      type: 'game',
      data: { action: 'playerJoined', role }
    });
  }


  handleMessage(clientId, ws, data) {
    console.log(`[SERVER] Parsed message:`, data);
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
        console.log('sending to handle game message');
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
    this.clients.set(clientId, ws);
    this.onlineUsers.set(decoded.id, ws);

    const roomId = 'pong-room';
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, { hostId: decoded.id, guestId: null, clients: new Set([clientId]) });
    } else {
      const room = this.rooms.get(roomId);
      if (!room.guestId && decoded.id !== room.hostId) {
        room.guestId = decoded.id;
      }
      room.clients.add(clientId);
    }

    const room = this.rooms.get(roomId);
    const role = room.hostId === decoded.id ? 'host' : room.guestId === decoded.id ? 'guest' : null;

    this.sendToClient(clientId, {
      type: 'auth-success',
      userId: decoded.id,
      role,
      opponentId: role === 'host' ? room.guestId : room.hostId
    });

    this.presence[decoded.id] = 1;
    this.broadcast({ type: 'user-status', userId: decoded.id, status: 'online' });

    console.log(`🔓 Authenticated user ${decoded.id} as ${role}`);
  } catch (err) {
    console.error('❌ Invalid token:', err.message);
    this.sendToClient(clientId, { type: 'error', message: 'Invalid token' });
    ws.close();
  }
}


// handleAuth(clientId, ws, token) {
//   if (!token) {
//     return this.sendToClient(clientId, { type: 'error', message: 'Missing token' });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     ws.userId = decoded.id;
//     this.clients.set(clientId, ws); // ✅ FIX CRUCIAL
//     this.onlineUsers.set(decoded.id, ws);

//     console.log(`🔓 Authenticated user ${decoded.id}`);
//     let role;
//     if (this.roles.hostId === decoded.id || !this.roles.hostId) {
//       this.roles.hostId = decoded.id;
//       role = 'host';
//     } else if (this.roles.guestId === decoded.id || !this.roles.guestId) {
//       this.roles.guestId = decoded.id;
//       role = 'guest';
//     } else {
//       role = 'noob';
//       console.warn(`🚫 Room full: host=${this.roles.hostId} guest=${this.roles.guestId}`);
//     }
//     // this.broadcast({ type: 'game', data: { action : 'playerJoined', by: `${decoded.id}`}});
//     if (decoded.id < this.presence.length) {
//       this.presence[decoded.id] = 1;
//       console.log(`✅ User ${decoded.id} is online`);
//     }
//     this.sendToClient(clientId, {
//       type: 'auth-success',
//       userId: decoded.id
//     });

//     this.broadcast({
//       type: 'user-status',
//       userId: decoded.id,
//       status: 'online'
//     });
//   } catch (err) {
//     console.error('❌ Invalid token:', err.message);
//     this.sendToClient(clientId, { type: 'error', message: 'Invalid token' });
//     ws.close();
//   }
// }
  // handleRemoteDc(userId)
  // {
  //   if (this.roles.hostId === userId) {
  //     this.roles.hostId = null;
  //     console.log(`hostId: ${this.roles.hostId} and ${userId}`);
  //     return;
  //   }
  //   else if (this.roles.guestId === userId) {
  //     this.roles.guestId = null;
  //     console.log(`Guest: ${this.roles.guestId} and ${userId}`);
  //     return;
  //   }
  // }

  // handleDisconnect(clientId, ws) {
  //   this.presence[ws.userId] = 0;
  //   console.log(`❌ User ${ws.userId} is offline`);
  //   console.log(`❌ Client disconnected: ${clientId}`);
  //   this.clients.delete(clientId);
  //   if (ws.userId && this.onlineUsers.has(ws.userId)) {
  //     this.onlineUsers.delete(ws.userId);
  //     this.broadcast({
  //       type: 'user-status',
  //       userId: ws.userId,
  //       status: 'offline'
  //     });
  //   }
  // }
  handleDisconnect(clientId, ws) {
  const wsUserId = ws.userId;
  const roomId = 'pong-room';

  if (this.rooms.has(roomId)) {
    const room = this.rooms.get(roomId);
    room.clients.delete(clientId);
    if (room.hostId === wsUserId) room.hostId = null;
    if (room.guestId === wsUserId) room.guestId = null;
    if (room.clients.size === 0) this.rooms.delete(roomId);
  }

  if (wsUserId && this.onlineUsers.has(wsUserId)) {
    this.presence[wsUserId] = 0;
    this.onlineUsers.delete(wsUserId);
    this.broadcast({ type: 'user-status', userId: wsUserId, status: 'offline' });
  }

  this.clients.delete(clientId);
  console.log(`❌ User ${wsUserId} disconnected`);
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
    console.log('going through handle game message');
    const { action, userId, ...rest } = payload || {};
    switch (action) {
      case 'pause':
        this.broadcast({ type: 'game', data: { action: 'pause', by: clientId } });
        break;
      case 'scoreUpdate':
        this.broadcast({ type: 'game', data: { action: 'scoreUpdate', ...rest } });
        break;
      case 'join': {
  const wsUserId = this.clients.get(clientId)?.userId;
  const roomId = 'pong-room';

  if (!this.rooms.has(roomId)) {
    // Premier utilisateur devient hôte
    this.rooms.set(roomId, {
      hostId: wsUserId,
      guestId: null,
      clients: new Set([clientId])
    });
  } else {
    const room = this.rooms.get(roomId);

    if (!room.guestId && wsUserId !== room.hostId) {
      room.guestId = wsUserId;
      room.clients.add(clientId);
    } else if (wsUserId === room.hostId || wsUserId === room.guestId) {
      room.clients.add(clientId); // reconnect éventuel
    } else {
      // Refuser une troisième connexion pour simplifier
      this.sendToClient(clientId, {
        type: 'error',
        data: { message: 'Room is full.' }
      });
      break;
    }
  }

  const room = this.rooms.get(roomId);

  const role =
    room.hostId === wsUserId ? 'host' :
    room.guestId === wsUserId ? 'guest' :

  this.sendToClient(clientId, {
    type: 'game',
    data: {
      action: 'playerJoined',
      role,
      opponentId: role === 'host' ? room.guestId : room.hostId
    }
  });

  break;
}
case 'startGame': {
  const room = this.rooms.get('pong-room');
  if (!room || !room.hostId || !room.guestId ||
      this.presence[room.hostId] !== 1 || this.presence[room.guestId] !== 1) {
    this.sendToClient(clientId, {
      type: 'error',
      message: 'Both players must be connected to start the game.'
    });
    return;
  }

  this.broadcast({
    type: 'game',
    data: {
      action: 'startGame',
      settings: rest.settings,
      startAt: rest.startAt,
      hostId: room.hostId,
      guestId: room.guestId,
    }
  });
  break;
}
      case 'endGame':
        this.broadcast({
          type: 'game',
          data: {
            action: 'endGame',
            winner: rest.winner,
            by: clientId
          }
        });
        break;
      case 'resetGame':
        this.broadcast({
          type: 'game',
          data: { action: 'resetGame', by: clientId }
        });
        break;
      case 'ballUpdate':
        this.broadcast({
          type: 'game',
          data: {
            action: 'ballUpdate',
            ...rest,
            clientId
          }
        });
        break;
      case 'ballReset':
        this.broadcast({
          type: 'game',
          data: {
            action: 'ballReset',
            ...rest,
            clientId
          }
        });
        break;
      case 'movePaddle':
        this.broadcast({
          type: 'game',
          data: {
            action: 'movePaddle',
            y: rest.y,
            clientId
          }
        });
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

sendToGameClient(userId, message) {
  const ws = this.onlineUsers.get(userId);
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
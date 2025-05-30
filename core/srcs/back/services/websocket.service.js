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
    // userId → Set<ws>
this.onlineUsers = new Map();

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
    const userId = decoded.id;
    ws.userId = userId;

    // 1) Enregistre client → ws
    this.clients.set(clientId, ws);

    // 2) Gère onlineUsers : userId → Set<ws>
    let sockets = this.onlineUsers.get(userId);
    if (!sockets) {
      sockets = new Set();
      this.onlineUsers.set(userId, sockets);
    }
    sockets.add(ws);

    // … reste de la logique de rooms, rôle, broadcast, etc.

  } catch (err) {
    console.error('❌ Error in handleAuth:', err);
    this.sendToClient(clientId, { type: 'error', message: 'Invalid token' });
    ws.close();
  }




    // 3) Création / mise à jour de la room
    const roomId = 'pong-room';
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        hostId:   userId,
        guestId:  null,
        clients:  new Set([clientId])
      });
    } else {
      const room = this.rooms.get(roomId);
      // si pas encore de guest et que ce n’est pas l’host
      if (!room.guestId && room.hostId !== userId) {
        room.guestId = userId;
      }
      room.clients.add(clientId);
    }

    const room = this.rooms.get(roomId);
    const { hostId, guestId } = room;

    // 4) Détermine le rôle et l’opposant pour CE client
    const role       = hostId === userId ? 'host' : 'guest';
    const opponentId = role === 'host' ? guestId : hostId;

    // 📨 Répond d’abord à CE client
    this.sendToClient(clientId, {
      type: 'auth-success',
      userId,
      role,
      opponentId
    });

    // 5) Si les deux joueurs sont là, broadcast playerJoined à tous
    if (hostId && guestId) {
      room.clients.forEach(id => {
        const wsClient = this.clients.get(id);
        if (!wsClient || typeof wsClient.userId !== 'number') return;

        const uid = wsClient.userId;
        const r   = uid === hostId ? 'host' : 'guest';
        const opp = r === 'host' ? guestId : hostId;

        this.sendToClient(id, {
          type: 'game',
          data: {
            action:     'playerJoined',
            role:       r,
            opponentId: opp
          }
        });
        console.log(`[WS] playerJoined → client=${id} role=${r} opponent=${opp}`);
      });
    }

    // Marque l’utilisateur en ligne et notifie
    this.presence[userId] = 1;
    this.broadcast({
      type:   'user-status',
      userId,
      status: 'online'
    });

    console.log(`🔓 Authenticated user ${userId} as ${role}`);
  }
   catch (err) {
    console.error('❌ Error in handleAuth:', err);
    this.sendToClient(clientId, { type: 'error', message: 'Invalid token' });
    ws.close();
  }
}

  handleDisconnect(clientId, ws) {
    const sockets = this.onlineUsers.get(wsUserId);
if (sockets) {
  sockets.delete(ws);
  if (sockets.size === 0) {
    this.onlineUsers.delete(wsUserId);
    // on broadcast “offline” ici seulement
    this.broadcast({ type: 'user-status', userId: wsUserId, status: 'offline' });
  }
}
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
  const { action, userId, gameId, ...rest } = payload;
  const roomKey = `pong-room-${gameId}`;

  switch (action) {
    case 'join': {
  // 1) Récupère la room (ici une seule room "pong-room")
  const roomId = 'pong-room';
  let room = this.rooms.get(roomId);

  // 2) Si pas de room, le premier devient host
  if (!room) {
    room = { hostId: userId, guestId: null, clients: new Set() };
    this.rooms.set(roomId, room);
  }
  // 3) Sinon, si pas de guest et pas lui-même l’host, devient guest
  else if (!room.guestId && room.hostId !== userId) {
    room.guestId = userId;
  }
  // 4) Ajoute toujours le client à la liste
  room.clients.add(clientId);

  // 5) Si deux joueurs présents, on notifie tout le monde une seule fois
  if (room.hostId && room.guestId) {
    for (const id of room.clients) {
      const wsClient = this.clients.get(id);
      if (!wsClient || typeof wsClient.userId !== 'number') continue;
      const uid = wsClient.userId;
      const role = uid === room.hostId ? 'host' : 'guest';
      const opp  = role === 'host' ? room.guestId : room.hostId;
      this.sendToClient(id, {
        type: 'game',
        data: { action: 'playerJoined', role, opponentId: opp }
      });
    }
  }
  break;
}
case 'leaveGame': {
  const roomId = 'pong-room';
  const room = this.rooms.get(roomId);
  if (!room) break;

  // 1) Retire le client
  room.clients.delete(clientId);
  // 2) Réinitialise host/guest si besoin
  if (room.hostId === userId)  room.hostId  = null;
  if (room.guestId === userId) room.guestId = null;
  // 3) Si plus personne, on détruit la room
  if (room.clients.size === 0) {
    this.rooms.delete(roomId);
  } else {
    // 4) Informe l’adversaire qu’on a quitté
    for (const otherId of room.clients) {
      this.sendToClient(otherId, {
        type: 'game',
        data: { action: 'playerLeft' }
      });
    }
  }
  break;
}

      case 'scoreUpdate':
        this.broadcast({ type: 'game', data: { action: 'scoreUpdate', ...rest } });
        break;
    

  const room = this.rooms.get(roomId);

  const role =
  room.hostId === wsUserId ? 'host' :
  room.guestId === wsUserId ? 'guest' :
  null; // 👈 Obligatoire !

this.sendToClient(clientId, {
  type: 'game',
  data: {
    action: 'playerJoined',
    role,
    opponentId: role === 'host' ? room.guestId : room.hostId
  }
});

case 'leaveGame':
      // retire ce client de la room
      room.clients.delete(clientId);
      if (room.hostId === userId) room.hostId = null;
      if (room.guestId=== userId) room.guestId= null;
      // informe l’adversaire
      for (const id of room.clients) {
        this.sendToClient(id, {
          type: 'game',
          data: { action: 'playerLeft' }
        });
      }
      break;
  break;

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
  const sockets = this.onlineUsers.get(toUserId) || new Set();
for (const sock of sockets) {
  if (sock.readyState === WebSocket.OPEN) {
    sock.send(msg);
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
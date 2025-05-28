// back.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const fastifyModule = require('fastify');
const WebSocketService = require('./services/websocket.service');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const fastifyMultipart = require('@fastify/multipart');
const fastifyStatic = require('@fastify/static');
const fastifyCors = require('@fastify/cors');
const authRoutes = require('./routes/auth.routes');
const avatarRoutes = require('./routes/avatar.routes');
const authenticate = require('./middleware/authenticate');

// Créer Fastify
const fastify = fastifyModule({
  logger: true,
  https: {
    key: fs.readFileSync(path.join(__dirname, 'certs/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certs/cert.pem')),
  },
});

// DB
const db = new Database('/data/database.sqlite');

// Plugins
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/',
  decorateReply: false
});

fastify.register(fastifyMultipart);
fastify.register(fastifyCors, {
  origin: true, // autorise tous les domaines OU précise le tien : 'http://localhost:5173'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});



// Middleware
fastify.decorate('authenticate', authenticate);

// Routes
fastify.register(authRoutes, { prefix: '/auth' });
fastify.register(avatarRoutes, { prefix: '/auth' });
fastify.register(require('./routes/gamelog.routes'), { prefix: '/game' });




fastify.get('/avatars/:filename', async (req, reply) => {
  const file = req.params.filename;
  const filePath = path.join(__dirname, 'public', 'avatars', file);
  if (fs.existsSync(filePath)) {
    reply.header('Access-Control-Allow-Origin', '*');
    return reply.type('image/png').send(fs.createReadStream(filePath));
  } else {
    return reply.status(404).send({ error: 'Fichier non trouvé' });
  }
});

fastify.get('/chat/messages/:userId', {
  preHandler: authenticate,
  handler: async (request, reply) => {
    const senderId = request.user.id;
    const receiverId = parseInt(request.params.userId, 10);

    const messages = db.prepare(`
      SELECT
        m.id,
        m.sender_id,
        m.receiver_id,
        m.content,
        m.timestamp,
        u.username AS sender_username
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?)
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.timestamp ASC
    `).all(senderId, receiverId, receiverId, senderId);

    return reply.send(messages);
  }
});



fastify.post('/chat/message', {
  preHandler: authenticate,
  handler: async (request, reply) => {
    const { receiverId, content } = request.body;
    const senderId = request.user.id;

    if (!receiverId || !content) {
      return reply.code(400).send({ error: 'receiverId and content are required' });
    }

    return reply.send({ success: true });
  }
});


fastify.get('/profile', async (request, reply) => {
  try {
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('Authorization header missing');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!user) throw new Error('Utilisateur non trouvé');
    return { id: user.id, username: user.username, avatar: user.avatar, twoFactorEnabled: user.two_factor_enabled };
  } catch (err) {
    return reply.status(401).send({ error: 'Accès refusé' });
  }
});

fastify.get('/2fa/setup', async (_, reply) => {
  try {
    const secret = speakeasy.generateSecret({ length: 20 });
    const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);
    return { qrCodeDataURL, secret: secret.base32 };
  } catch (err) {
    reply.code(500).send({ error: 'Failed to generate QR code' });
  }
});

fastify.get('/debug-static', (req, reply) => {
  const filePath = path.join(__dirname, 'public', 'avatars', 'default.png');
  return {
    path: filePath,
    exists: fs.existsSync(filePath)
  };
});

// Online users route
fastify.get('/auth/online-users', {
  preHandler: [fastify.authenticate],
  handler: async (req, reply) => {
    return { online: fastify.websocketService.getOnlineUserIds() };
  }
});

fastify.get('/health', async (request, reply) => {
  reply.code(200).send({ status: 'ok' });
});

fastify.get('/', async (request, reply) => {
  return { message: 'API is working' };
});

// Launch server
const wsService = new WebSocketService(fastify.server);
fastify.decorate('websocketService', wsService);

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`🚀 Serveur HTTPS + WebSocket en écoute sur ${address}`);
});

fastify.get('/users/:id', {
  preHandler: [authenticate], // 🔐 protège la route
  handler: async (request, reply) => {
    const friendId = parseInt(request.params.id, 10);

    const user = db.prepare(`
      SELECT id, username, avatar
      FROM users
      WHERE id = ?
    `).get(friendId);

    if (!user) {
      return reply.code(404).send({ error: 'Utilisateur non trouvé' });
    }

    return {
      id: user.id,
      username: user.username,
      avatar: user.avatar || 'default.png'
    };
  }
});


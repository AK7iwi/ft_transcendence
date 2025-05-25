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
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
});

// Middleware
fastify.decorate('authenticate', authenticate);

// Routes
fastify.register(authRoutes, { prefix: '/auth' });
fastify.register(avatarRoutes, { prefix: '/auth' });

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

// Launch server
// WebSocket setup AVANT .listen()
const wsService = new WebSocketService(fastify.server);
fastify.decorate('websocketService', wsService);

fastify.get('/health', async (request, reply) => {
  reply.code(200).send({ status: 'ok' });
});


// Démarrage du serveur
fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`🚀 Serveur HTTPS + WebSocket en écoute sur ${address}`);
});

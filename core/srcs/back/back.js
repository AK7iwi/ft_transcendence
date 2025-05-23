// back.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const fastifyModule = require('fastify');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const xss = require('xss');
const validator = require('validator');
const fastifyMultipart = require('@fastify/multipart');
const fastifyStatic = require('@fastify/static');
const authRoutes = require('./routes/auth.routes');

// Créer Fastify
const fastify = fastifyModule({
  logger: true,
  https: {
    key: fs.readFileSync(path.join(__dirname, 'certs/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certs/cert.pem')),
  },
});

fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/',
  decorateReply: false // ⚠️ important pour compatibilité Fastify v4
});


// Auth Routes
fastify.register(require('./routes/auth.routes'), { prefix: '/auth' });



// Route manuelle pour servir les avatars (fallback sans sendFile)
fastify.get('/avatars/:filename', async (req, reply) => {
  const file = req.params.filename;
  const filePath = path.join(__dirname, 'public', 'avatars', file);

  if (fs.existsSync(filePath)) {
    return reply
      .type('image/png') // ou adapte à image/jpeg si nécessaire
      .send(fs.createReadStream(filePath));
  } else {
    return reply.status(404).send({ error: 'Fichier non trouvé' });
  }
});



// ✅ Maintenant que fastify existe, on peut enregistrer le plugin
fastify.register(fastifyMultipart);


fastify.decorate('authenticate', require('./middleware/authenticate'));



// Base de données SQLite
const db = new Database('/data/database.sqlite');

// CORS
fastify.register(require('@fastify/cors'), {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
});


// Route healthcheck
fastify.get('/health', async () => {
  return { status: 'ok' };
});

// Route sécurisée avec JWT
fastify.get('/profile', async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) throw new Error('Authorization header missing');
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!user) throw new Error('Utilisateur non trouvé');
    return { user: { id: user.id, username: user.username } };
  } catch (err) {
    return reply.status(401).send({ error: 'Accès refusé' });
  }
});

// 2FA Setup
fastify.get('/2fa/setup', async (request, reply) => {
  try {
    const secret = speakeasy.generateSecret({ length: 20 });
    console.log('Generated secret:', secret); // 🪵 log ici
    const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url);
    return { qrCodeDataURL, secret: secret.base32 };
  } catch (err) {
    console.error('QR Code generation error:', err); // 🛠 debug ici
    reply.code(500).send({ error: 'Failed to generate QR code' });
  }
});


fastify.get('/', async (request, reply) => {
  return { message: 'Welcome to the backend API 🚀' };
});


fastify.get('/debug-static', (req, reply) => {
  const filePath = path.join(__dirname, 'public', 'avatars', 'default.png');
  return {
    path: filePath,
    exists: fs.existsSync(filePath)
  };
});


// Démarrer le serveur Fastify et attacher WebSocket
fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  const server = fastify.server;
  const wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('✅ Client WebSocket connecté');
    ws.send(JSON.stringify({ type: 'connection', message: 'Bienvenue !' }));

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log('📩 Message WS reçu :', data);
      } catch (err) {
        console.error('❌ Erreur parsing message :', err);
        ws.send(JSON.stringify({ type: 'error', message: 'Format invalide' }));
      }
    });

    ws.on('close', () => {
      console.log('❌ Client WebSocket déconnecté');
    });
  });

  console.log(`🚀 Serveur HTTPS + WebSocket en écoute sur ${address}`);
});

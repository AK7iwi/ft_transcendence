// back.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const fastifyModule = require('fastify');
const WebSocketService = require('./services/websocket.service');
const fastifyMultipart = require('@fastify/multipart');
const fastifyStatic = require('@fastify/static');
const fastifyCors = require('@fastify/cors');
const authRoutes = require('./routes/auth.routes');
const avatarRoutes = require('./routes/avatar.routes');
const JWTAuthentication = require('./middleware/jwt/jwt.auth');
const SanitizeService = require('./middleware/security.middleware');

// Créer Fastify
const fastify = fastifyModule({
    logger: true,
    https: {
        key: fs.readFileSync(path.join(__dirname, 'certs/key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'certs/cert.pem')),
    },
});

// DB
const { db } = require('./db');

// Plugins
fastify.register(fastifyStatic, {
    root: path.join(__dirname, 'public', 'avatars'),
    prefix: '/avatars/',
    decorateReply: false
});

fastify.register(fastifyMultipart);
fastify.register(fastifyCors, {
    origin: true, // autorise tous les domaines OU précise le tien : 'http://localhost:5173'
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
});

// Routes
fastify.register(authRoutes, { prefix: '/auth' });
fastify.register(avatarRoutes, { prefix: '/auth' });
fastify.register(require('./routes/gamelog.routes'));
fastify.register(require('./routes/tournament.routes'), { prefix: '/tournament' });
fastify.register(require('./routes/profile.routes'));

fastify.get('/chat/messages/:userId', {
    preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
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
    preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
    handler: async (request, reply) => {
        const { receiverId, content } = request.body;
        const senderId = request.user.id;

        if (!receiverId || !content) {
            return reply.code(400).send({ error: 'receiverId and content are required' });
        }

        return reply.send({ success: true });
    }
});

fastify.get('/health', async (request, reply) => {
    reply.code(200).send({ status: 'ok' });
});

fastify.get('/', async (request, reply) => {
    return { message: 'API is working' };
});

fastify.get('/users/:id', {
    preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
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

// Launch server
const wsService = new WebSocketService(fastify.server);
fastify.decorate('websocketService', wsService);

fastify.listen({ port: process.env.PORT, host: process.env.HOST }, (err, address) => {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    console.log(`🚀 Serveur HTTPS + WebSocket en écoute sur ${address}`);
});



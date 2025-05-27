require('dotenv').config();
const fastifyModule = require('fastify');
const cors = require('@fastify/cors');
const websocket = require('@fastify/websocket');
const axios = require('axios');
const SecurityMiddleware = require('../security/middleware/sanitize.service');
const authRoutes = require('./routes/auth.routes');
// const gameRoutes = require('./routes/game.routes');
// const tournamentRoutes = require('./routes/tournament.routes');
// const chatRoutes = require('./routes/chat.routes');
// const userRoutes = require('./routes/user.routes');

// Initialize Fastify
const fastify = fastifyModule({ logger: true });

// Register plugins
fastify.register(cors, { origin: true });

// Register websocket
fastify.register(websocket);

// Configure axios
const axiosInstance = axios.create({
    timeout: 5000, // 5 seconds timeout
    headers: {
        'Content-Type': 'application/json'
    }
});

// Register axios instance
fastify.decorate('axios', axiosInstance);

// fastify.addHook('preHandler', SecurityMiddleware.securityMiddleware);

// Basic route
fastify.get('/', async (request, reply) => {
    return { message: 'Server is running' };
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
    return { status: 'Server is healthy' };
});

// Register routes
fastify.register(authRoutes, { prefix: '/auth' });
// fastify.register(gameRoutes, { prefix: '/game' });
// fastify.register(tournamentRoutes, { prefix: '/tournament' });
// fastify.register(chatRoutes, { prefix: '/chat' });
// fastify.register(userRoutes, { prefix: '/user' });

// Error handling
fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    reply.status(error.statusCode || 500).send({
        error: error.message || 'Internal Server Error'
    });
});

// Start server
const start = async () => {
    try {
        await fastify.listen({ 
            port: process.env.GATEWAY_PORT,
            host: '0.0.0.0'
        });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();

require('dotenv').config();
const fastifyModule = require('fastify');
const cors = require('@fastify/cors');
const websocket = require('@fastify/websocket');
const axios = require('axios');
const authRoutes = require('./routes/auth.routes');
// const gameRoutes = require('./routes/game.routes');
// const tournamentRoutes = require('./routes/tournament.routes');
// const chatRoutes = require('./routes/chat.routes');
// const userRoutes = require('./routes/user.routes');
const fs = require('fs');
const path = require('path');

// Initialize Fastify
const fastify = fastifyModule({
    logger: true,
    https: {
      key: fs.readFileSync(path.join(__dirname, '../certs/key.pem')),
      cert: fs.readFileSync(path.join(__dirname, '../certs/cert.pem')),
    },
  });

// Register plugins
fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  });

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

// Basic route
fastify.get('/', async (request, reply) => {
    reply.code(200).send({ message: 'Server is running' });
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
    reply.code(200).send( { status: 'Server is healthy' });
});

// Register routes
fastify.register(authRoutes, { prefix: '/auth' });
// fastify.register(gameRoutes, { prefix: '/game' });
// fastify.register(tournamentRoutes, { prefix: '/tournament' });
// fastify.register(chatRoutes, { prefix: '/chat' });
// fastify.register(userRoutes, { prefix: '/user' });

// Error handling
fastify.setErrorHandler((error, request, reply) => {
    // Validation error (schema)
    if (error.statusCode) {
        return reply.status(error.statusCode).send({
            success: false,
            message: error.message
        });
    }

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

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const fastifyModule = require('fastify');
const cors = require('@fastify/cors');
const websocket = require('@fastify/websocket');
const multipart = require('@fastify/multipart');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const friendRoutes = require('./routes/friend.routes');
const chatRoutes = require('./routes/chat.routes');
const tournamentRoutes = require('./routes/tournament.routes');
const ServiceClient = require('./utils/service-client');
const ErrorHandler = require('./utils/error/error-handler');

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

// Register multipart for file uploads
fastify.register(multipart);

// Create and register service client
const serviceClient = new ServiceClient(fastify);
fastify.decorate('serviceClient', serviceClient);

// Register routes
fastify.register(authRoutes, { prefix: '/auth' });
fastify.register(userRoutes, { prefix: '/user' });
fastify.register(friendRoutes, { prefix: '/friend' });
fastify.register(chatRoutes, { prefix: '/chat' });
fastify.register(tournamentRoutes, { prefix: '/tournament' });

// Basic route
fastify.get('/', async (request, reply) => {
    reply.code(200).send({ success: true, message: 'Server is running' });
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
    reply.code(200).send({ success: true, message: 'Server is healthy' });
});

fastify.setErrorHandler((error, request, reply) => {
    // Don't handle service-client errors
    if (error.success === false) {
        return reply.code(error.statusCode || 500).send(error);
    }
    
    // Handle other errors normally (include validation errors)
    return ErrorHandler.handle(error, request, reply);
});

// Start server
const start = async () => {
    try {
        await fastify.listen({ 
            port: process.env.GATEWAY_PORT,
            host: process.env.HOST
        });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();

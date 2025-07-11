require('dotenv').config();
const initializeDatabase = require('./database/schema');
const fastify = require('fastify');
const chatRoutes = require('./chat/chat.routes');
const internalRoutes = require('./internal/internal.routes');
const ErrorHandler = require('./utils/error/error-handler');

// Create Fastify instance
const app = fastify({ logger: true });

// Initialize database
initializeDatabase();

// Register routes
app.register(chatRoutes, { prefix: '/chat' });
app.register(internalRoutes, { prefix: '/chat/internal' });

// Test endpoint
app.get('/', async (request, reply) => {
    reply.code(200).send({ success: true, message: 'Server is running' });
});

// Health check endpoint
app.get('/health', async (request, reply) => {
    reply.code(200).send({ success: true, message: 'Server is healthy' });
});

// Register error handler
app.setErrorHandler(ErrorHandler.handle);

// Start server
const start = async () => {
    try {
        await app.listen({ 
            port: process.env.CHAT_PORT,
            host: process.env.HOST
        });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
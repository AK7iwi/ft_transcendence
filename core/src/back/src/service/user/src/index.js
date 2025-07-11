require('dotenv').config();
const initializeDatabase = require('./database/schema');
const fastify = require('fastify');
const userRoutes = require('./user/user.routes');
const avatarRoutes = require('./avatar/avatar.routes');
const updateRoutes = require('./update/update.routes');
const internalRoutes = require('./internal/internal.routes');
const ServiceClient = require('./utils/service-client');
const ErrorHandler = require('./utils/error/error-handler');

// Create Fastify instance
const app = fastify({ logger: true });

// Register multipart for file uploads
app.register(require('@fastify/multipart'));

// Create and register service client
const serviceClient = new ServiceClient(app);
app.decorate('serviceClient', serviceClient);

// Initialize database
initializeDatabase();

// Register routes
app.register(userRoutes, { prefix: '/user' });
app.register(avatarRoutes, { prefix: '/user' });
app.register(updateRoutes, { prefix: '/user' });
app.register(internalRoutes, { prefix: '/user/internal' });

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
            port: process.env.USER_PORT,
            host: process.env.HOST
        });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
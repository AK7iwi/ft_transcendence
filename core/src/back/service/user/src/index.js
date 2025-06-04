const fastify = require('fastify');
require('dotenv').config();
const initializeDatabase = require('./database/schema');
const userRoutes = require('./user/user.routes');
const updateRoutes = require('./update/update.routes');
const internalRoutes = require('./internal/internal.routes');
const ServiceClient = require('./utils/service-client');

// Create Fastify instance
const app = fastify({ logger: true });

// Create and register service client
const serviceClient = new ServiceClient(app);
app.decorate('serviceClient', serviceClient);

// Initialize database
initializeDatabase();

// Register routes
app.register(userRoutes, { prefix: '/user' });
app.register(updateRoutes, { prefix: '/user' });
app.register(internalRoutes, { prefix: '/user' });

// Test endpoint
app.get('/', async (request, reply) => {
    reply.code(200).send({ success: true, message: 'Server is running' });
});

// Health check endpoint
app.get('/health', async (request, reply) => {
    reply.code(200).send({ success: true, message: 'Server is healthy' });
});

// Start server
const start = async () => {
    try {
        await app.listen({ 
            port: process.env.USER_PORT,
            host: '0.0.0.0'
        });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
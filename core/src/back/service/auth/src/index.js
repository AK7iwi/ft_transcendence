const fastify = require('fastify');
require('dotenv').config();
const initializeDatabase = require('./database/schema');
const authRoutes = require('./auth/auth.routes');
const twoFactorRoutes = require('./two-factor/two-factor.routes');
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
app.register(authRoutes, { prefix: '/auth' });
app.register(twoFactorRoutes, { prefix: '/auth' });
app.register(internalRoutes, { prefix: '/auth' });

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
            port: process.env.AUTH_PORT,
            host: '0.0.0.0'
        });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
require('dotenv').config();
const fastify = require('fastify');
const initializeDatabase = require('./database/schema');
const tournamentRoutes = require('./tournament/tournament.routes');
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
app.register(tournamentRoutes, { prefix: '/tournament' });
app.register(internalRoutes, { prefix: '/tournament/internal' });

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
            port: process.env.TOURNAMENT_PORT,
            host: process.env.HOST
        });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
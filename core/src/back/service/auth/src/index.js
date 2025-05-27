const fastify = require('fastify');
require('dotenv').config();
const initializeDatabase = require('./database/schema');
const authRoutes = require('./routes/auth.routes');

// Create Fastify instance
const app = fastify({ logger: true });

// Initialize database
initializeDatabase();

// Register routes
app.register(authRoutes, { prefix: '/auth' });

// Health check endpoint
app.get('/health', async () => {
    return { status: 'ok' };
});

app.setErrorHandler((error, request, reply) => {
    app.log.error(error);
    reply.status(error.statusCode || 500).send({
        error: error.message || 'Internal Server Error'
    });
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
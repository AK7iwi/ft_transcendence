const fastify = require('fastify');
const axios = require('axios');
require('dotenv').config();
const initializeDatabase = require('./database/schema');
const authRoutes = require('./routes/auth.routes');
const internalRoutes = require('./routes/internal.routes');

// Create Fastify instance
const app = fastify({ logger: true });

// Create axios instance with configuration
const axiosInstance = axios.create({
    timeout: 5000, // 5 seconds timeout
    headers: {
        'Content-Type': 'application/json'
    }
});

// Register axios instance
app.decorate('axios', axiosInstance);

// Initialize database
initializeDatabase();

// Register routes
app.register(authRoutes, { prefix: '/auth' });
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
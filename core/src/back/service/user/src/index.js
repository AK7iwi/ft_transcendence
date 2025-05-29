const fastify = require('fastify');
require('dotenv').config();
const initializeDatabase = require('./database/schema');
const userRoutes = require('./routes/user.routes');

// Create Fastify instance
const app = fastify({ logger: true });

// Initialize database
initializeDatabase();

// Register routes
app.register(userRoutes, { prefix: '/user' });

app.get('/', async () => {
    reply.code(200).send({ message: 'Server is running' });
});

// Health check endpoint
app.get('/health', async () => {
    reply.code(200).send( { status: 'Server is healthy' });
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
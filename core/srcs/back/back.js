const fastify = require("fastify")({
    logger: true,
    https: {
        key: require('fs').readFileSync(process.env.SSL_KEY_PATH),
        cert: require('fs').readFileSync(process.env.SSL_CERT_PATH)
    }
});
require("dotenv").config();
const db = require('./db');
const authRoutes = require('./routes/auth.routes');
const { xssProtection, sqlInjectionProtection } = require('./middleware/security.middleware');
const WebSocketService = require('./services/websocket.service');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

// Configure CORS with secure options
fastify.register(require('@fastify/cors'), {
    origin: process.env.FRONTEND_URL || 'https://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Type', 'Authorization']
});

// Add security headers
fastify.addHook('onRequest', async (request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    reply.header('Content-Security-Policy', "default-src 'self' wss: https:; connect-src 'self' wss: https:;");
});

// Add security middleware
fastify.addHook('preHandler', async (request, reply) => {
    try {
        await xssProtection(request, reply);
        await sqlInjectionProtection(request, reply);
    } catch (error) {
        reply.code(400).send({ error: error.message });
    }
});

// Register routes
fastify.register(authRoutes, { prefix: '/auth' });

fastify.get("/", async (request, reply) =>
{
  return {status: "ok", message: "Server is running"};
});

// Health check endpoint
fastify.get("/health", async (request, reply) =>
  {
  try
  {
    // Test database connection
    const result = db.prepare('SELECT 1 as test').get();
    return {status: "ok", database: "connected", test: result};
  }
  catch (error)
  {
    fastify.log.error(error);
    reply.code(500).send({status: "error", message: "Database connection failed"});
  }
});

const start = async () =>
{
  try
  {
    await fastify.listen({port: PORT, host: HOST});
    fastify.log.info(`Server listening on https://${HOST}:${PORT}`);
  } 
  catch (err)
  {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

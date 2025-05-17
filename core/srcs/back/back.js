// Load environment variables first
require("dotenv").config();

// Then create the Fastify instance with SSL configuration
const fastify = require("fastify")({
    logger: true,
    https: {
        key: require('fs').readFileSync(process.env.SSL_KEY_PATH),
        cert: require('fs').readFileSync(process.env.SSL_CERT_PATH)
    }
});

const db = require('./db');
const authRoutes = require('./routes/auth.routes');
const { xssProtection, sqlInjectionProtection } = require('./middleware/security.middleware');
const WebSocketService = require('./services/websocket.service');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

// Simple rate limiting implementation
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // Maximum 100 requests per minute

// Rate limiting middleware
fastify.addHook('onRequest', async (request, reply) => {
    const ip = request.ip;
    const now = Date.now();
    
    if (!rateLimit.has(ip)) {
        rateLimit.set(ip, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW
        });
    } else {
        const userLimit = rateLimit.get(ip);
        if (now > userLimit.resetTime) {
            userLimit.count = 1;
            userLimit.resetTime = now + RATE_LIMIT_WINDOW;
        } else if (userLimit.count >= RATE_LIMIT_MAX) {
            reply.code(429).send({
                error: 'Too Many Requests',
                message: 'Rate limit exceeded, please try again later',
                retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
            });
            return;
        } else {
            userLimit.count++;
        }
    }
});

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
    reply.header('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self' wss: https:",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "base-uri 'self'",
        "object-src 'none'"
    ].join('; '));
    reply.header('X-CSRF-Token', generateCSRFToken());
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

// Add CSRF middleware
fastify.addHook('preHandler', async (request, reply) => {
    if (request.method !== 'GET') {
        const token = request.headers['x-csrf-token'];
        if (!token || !validateCSRFToken(token)) {
            reply.code(403).send({ error: 'Invalid CSRF token' });
        }
    }
});

// Add request size limit middleware
fastify.addHook('preHandler', async (request, reply) => {
    const contentLength = request.headers['content-length'];
    if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
        reply.code(413).send({ error: 'Request entity too large' });
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

function generateCSRFToken() {
    return crypto.randomBytes(32).toString('hex');
}

function validateCSRFToken(token) {
    // Implement token validation logic
    // This could include checking against a stored token or validating the token format
    return token && token.length === 64; // Basic validation
}

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

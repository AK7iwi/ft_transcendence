const fs = require('fs');
const https = require('https');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();

// Load HTTPS certs
const options = {
  key: fs.readFileSync('./certs/key.pem'),
  cert: fs.readFileSync('./certs/cert.pem')
};

const path = require('path');

app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'certs', 'cert.pem')); // 👈 or use a real favicon file
});

// Middleware
app.use(cors({
  origin: 'https://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'"
    );
    next();
  });
  

// Healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Register route example
app.post('/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Missing username or password' });

  try {
    const exists = await db.getUserByUsername(username);
    if (exists)
      return res.status(409).json({ error: 'User already exists' });

    await db.createUser({ username, email,password });
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start HTTPS server
https.createServer(options, app).listen(3000, () => {
  console.log('Backend running at https://localhost:3000');
});


// // Load environment variables first
// require("dotenv").config();

// // Then create the Fastify instance with SSL configuration
// const fastify = require("fastify")({
//     logger: true,
//     https: {
//         key: require('fs').readFileSync(process.env.SSL_KEY_PATH),
//         cert: require('fs').readFileSync(process.env.SSL_CERT_PATH)
//     }
// });

// const db = require('./db');
// const authRoutes = require('./routes/auth.routes');
// const { xssProtection, sqlInjectionProtection } = require('./middleware/security.middleware');
// const WebSocketService = require('./services/websocket.service');
// const { sanitizeInput } = require('./middleware/validation.middleware');

// const PORT = process.env.PORT || 3000;
// const HOST = '0.0.0.0'; // Listen on all network interfaces

// // Simple rate limiting implementation
// const rateLimit = new Map();
// const RATE_LIMIT_WINDOW = 60000; // 1 minute
// const RATE_LIMIT_MAX = 100; // Maximum 100 requests per minute

// // Rate limiting middleware
// fastify.addHook('onRequest', async (request, reply) => {
//     const ip = request.ip;
//     const now = Date.now();
    
//     if (!rateLimit.has(ip)) {
//         rateLimit.set(ip, {
//             count: 1,
//             resetTime: now + RATE_LIMIT_WINDOW
//         });
//     } else {
//         const userLimit = rateLimit.get(ip);
//         if (now > userLimit.resetTime) {
//             userLimit.count = 1;
//             userLimit.resetTime = now + RATE_LIMIT_WINDOW;
//         } else if (userLimit.count >= RATE_LIMIT_MAX) {
//             reply.code(429).send({
//                 error: 'Too Many Requests',
//                 message: 'Rate limit exceeded, please try again later',
//                 retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
//             });
//             return;
//         } else {
//             userLimit.count++;
//         }
//     }
// });

// // Configure CORS with secure options
// fastify.register(require('@fastify/cors'), {
//     origin: process.env.FRONTEND_URL || 'https://localhost:5173',
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     exposedHeaders: ['Content-Type', 'Authorization']
// });

// // Add security headers
// fastify.addHook('onRequest', async (request, reply) => {
//     reply.header('X-Content-Type-Options', 'nosniff');
//     reply.header('X-Frame-Options', 'DENY');
//     reply.header('X-XSS-Protection', '1; mode=block');
//     reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
//     reply.header('Content-Security-Policy', [
//         "default-src 'self'",
//         "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
//         "style-src 'self' 'unsafe-inline'",
//         "img-src 'self' data: https:",
//         "font-src 'self'",
//         "connect-src 'self' wss: https:",
//         "frame-ancestors 'none'",
//         "form-action 'self'",
//         "base-uri 'self'",
//         "object-src 'none'"
//     ].join('; '));
// });

// // Add security middleware
// fastify.addHook('preHandler', async (request, reply) => {
//     try {
//         await xssProtection(request, reply);
//         await sqlInjectionProtection(request, reply);
//     } catch (error) {
//         reply.code(400).send({ error: error.message });
//     }
// });

// // Add request size limit middleware
// fastify.addHook('preHandler', async (request, reply) => {
//     const contentLength = request.headers['content-length'];
//     if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
//         reply.code(413).send({ error: 'Request entity too large' });
//     }
// });

// // Add validation middleware
// fastify.addHook('preHandler', sanitizeInput);

// // Register routes
// fastify.register(authRoutes, { prefix: '/auth' });

// fastify.get("/", async (request, reply) =>
// {
//   return {status: "ok", message: "Server is running"};
// });

// // Health check endpoint
// fastify.get("/health", async (request, reply) =>
//   {
//   try
//   {
//     // Test database connection
//     const result = db.prepare('SELECT 1 as test').get();
//     return {status: "ok", database: "connected", test: result};
//   }
//   catch (error)
//   {
//     fastify.log.error(error);
//     reply.code(500).send({status: "error", message: "Database connection failed"});
//   }
// });

// const start = async () =>
// {
//   try
//   {
//     await fastify.listen({port: PORT, host: HOST});
//     fastify.log.info(`Server listening on https://${HOST}:${PORT}`);
//   } 
//   catch (err)
//   {
//     fastify.log.error(err);
//     process.exit(1);
//   }
// };

// start();

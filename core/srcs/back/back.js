const fastify = require("fastify")({logger:true});
require("dotenv").config();
const db = require('./db');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

// Configure CORS
fastify.register(require('@fastify/cors'),
{
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

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

// Example user route
fastify.get("/users", async (request, reply) =>
{
  try
  {
    const users = db.prepare('SELECT id, username, email, created_at FROM users').all();
    return {users};
  }
  catch (error)
  {
    fastify.log.error(error);
    reply.code(500).send({ error: 'Internal server error' });
  }
});

const start = async () =>
{
  try
  {
    await fastify.listen({port: PORT, host: HOST});
    fastify.log.info(`Server listening on http://${HOST}:${PORT}`);
  } 
  catch (err)
  {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

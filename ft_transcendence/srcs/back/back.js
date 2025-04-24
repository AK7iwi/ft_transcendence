const fastify = require("fastify")({ logger: true });
require("dotenv").config();

const PORT = process.env.PORT || 3000;

fastify.register(require('@fastify/cors'), {
  origin: "http://localhost:5173",
  credentials: true
});

fastify.get("/", async (request, reply) => {
  return { hello: "world" };
});

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    fastify.log.info(`Server listening on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

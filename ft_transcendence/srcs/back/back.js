const fastify = require("fastify")({ logger: true });
require("dotenv").config();

const PORT = process.env.PORT || 3000;

fastify.get("/", async (request, reply) => {
  return { hello: "world" };
});

fastify.get("/health", async (request, reply) => {
  reply.status(200).send({ status: "ok" });
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

const fastify = require("fastify")({ logger: true });
const path = require("path");
require("dotenv").config();

fastify.register(require("@fastify/cors"), {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
});

const publicPath = path.join(__dirname, "..", "srcs", "front", "front_srcs");
console.log("Serving static files from:", publicPath);

fastify.register(require("@fastify/static"), {
  root: publicPath,
  prefix: "/",
});

fastify.get("/", async (request, reply) => {
  return reply.sendFile("index.html");
});

const PORT = process.env.PORT || 3000;

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

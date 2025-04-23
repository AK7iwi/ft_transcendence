console.log("🟣 back.js rechargé !");


const fastify = require("fastify")({ logger: true });
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db");
const { registerSchema } = require("./validation");
const z = require("zod");
const {
  generateSecret,
  generateQRCode,
  verify2FACode,
} = require("./utils/2fa");

require("dotenv").config();

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

fastify.register(require("@fastify/formbody"));

// ✅ Route GET /
fastify.get("/", async (request, reply) => {
  return { hello: "world" };
});

// ✅ Route POST /register
fastify.post("/register", async (req, reply) => {
  try {
    const { username, password } = registerSchema.parse(req.body);
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
    stmt.run(username, hashedPassword);

    reply.send({ message: "Utilisateur créé avec succès" });
  } catch (err) {
    if (err.name === "ZodError") {
      return reply.status(400).send({
        error: err.errors.map((e) => e.message).join(", "),
      });
    }

    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return reply.status(400).send({ error: "Nom d'utilisateur déjà utilisé" });
    }

    fastify.log.error(err);
    reply.status(500).send({ error: "Erreur serveur" });
  }
});

// ✅ Route POST /login
fastify.post("/login", async (req, reply) => {
  const loginSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(6),
  });

  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: "Données invalides" });
  }

  const { username, password } = parsed.data;
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

  if (!user) {
    return reply.status(401).send({ error: "Utilisateur introuvable" });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return reply.status(401).send({ error: "Mot de passe incorrect" });
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      twoFactorValidated: false,
    },
    JWT_SECRET,
    { expiresIn: "10m" }
  );

  reply.send({ message: "Connexion initiale réussie", token });
});

// ✅ Route POST /2fa/enable
fastify.post("/2fa/enable", async (req, reply) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return reply.status(401).send({ error: "Token manquant" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.twoFactorValidated) {
      return reply.status(400).send({ error: "2FA déjà activé" });
    }

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(decoded.id);
    if (!user) return reply.status(404).send({ error: "Utilisateur introuvable" });

    if (user.twoFactorSecret) {
      return reply.status(400).send({ error: "2FA déjà activé pour cet utilisateur" });
    }

    const { secret, otpauth } = generateSecret(user.username);
    const qrCode = await generateQRCode(otpauth);

    db.prepare("UPDATE users SET twoFactorSecret = ? WHERE id = ?").run(secret, user.id);

    return reply.send({
      message: "2FA activé temporairement",
      qrCode,
      manualEntryKey: secret,
    });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(401).send({ error: "Token invalide ou expiré" });
  }
});

// ✅ Route POST /2fa/validate
fastify.post("/2fa/validate", async (req, reply) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return reply.status(401).send({ error: "Token manquant" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(decoded.id);
    if (!user || !user.twoFactorSecret) {
      return reply.status(400).send({ error: "2FA non activé pour cet utilisateur" });
    }

    const { code } = req.body;
    if (!code || code.length !== 6) {
      return reply.status(400).send({ error: "Code 2FA invalide" });
    }

    const isValid = verify2FACode(user.twoFactorSecret, code);
    if (!isValid) {
      return reply.status(401).send({ error: "Code 2FA incorrect" });
    }

    const newToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        twoFactorValidated: true,
      },
      JWT_SECRET,
      { expiresIn: "30m" }
    );

    return reply.send({
      message: "2FA validé avec succès",
      token: newToken,
    });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(401).send({ error: "Token invalide ou expiré" });
  }
});

// 🚀 Lancer le serveur avec routes loggées
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });

    console.log("🧪 Juste avant fastify.ready()");
await fastify.ready();
console.log("🧪 Juste après fastify.ready()");
console.log("✅✅✅ ROUTES SUIVENT ⬇️");
console.log(fastify.printRoutes());
console.log("✅ Le fichier back.js est bien exécuté");

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

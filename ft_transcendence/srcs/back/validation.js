const { z } = require("zod");

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Le nom d'utilisateur doit faire au moins 3 caractères")
    .max(20)
    .regex(/^[a-zA-Z0-9_-]+$/, "Caractères non autorisés"),
  password: z
    .string()
    .min(6, "Le mot de passe doit faire au moins 6 caractères"),
});

module.exports = {
  registerSchema,
};

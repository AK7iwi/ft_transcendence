const AuthService = require('../services/auth.service');
const authSchema = require('../schemas/auth.schema');
const jwt = require('jsonwebtoken');
const dbApi = require('../db');
const authenticate = require('../middleware/authenticate');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { sqlInjectionProtection, xssProtection } = require('../middleware/security.middleware');

console.log('[INIT] auth.routes.js loaded');

async function authRoutes(fastify, options) {
  fastify.get('/me', {
    preHandler: [authenticate],
    handler: async (req, reply) => {
      try {
        const id = req.user.id;
        const user = dbApi.db.prepare('SELECT id, username, avatar, two_factor_enabled FROM users WHERE id = ?').get(id);

        if (!user) {
          return reply.status(404).send({ error: 'Utilisateur non trouvé' });
        }

        return {
          id: user.id,
          username: user.username,
          avatar: user.avatar || '/avatars/default.png',
          twoFactorEnabled: !!user.two_factor_enabled
        };
      } catch (err) {
        console.error('[ERROR] /auth/me failed:', err);
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  fastify.post('/register', {
    schema: authSchema.register,
    preHandler: [sqlInjectionProtection, xssProtection],
    handler: async (request, reply) => {
      try {
        const { username, password } = request.body;
        const userId = await AuthService.registerUser(username, password);

        return reply.code(200).send({
          success: true,
          message: 'User registered successfully',
          userId
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  });

  fastify.post('/login', {
  schema: authSchema.login,
  handler: async (request, reply) => {
    try {
      const { username, password } = request.body;
      const user = await AuthService.loginUser(username, password);

      // 🔒 Si 2FA activée, renvoie une réponse spéciale (sans token)
      if (user.twoFactorEnabled) {
        return reply.code(200).send({
          success: true,
          message: '2FA required',
          twofa: true,
          userId: user.id,
          username: user.username
        });
      }

      // 🔓 Sinon, login classique avec token JWT
      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      return reply.code(200).send({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      return reply.code(401).send({
        success: false,
        error: error.message
      });
    }
  }
});


  fastify.put('/update', {
    preHandler: [sqlInjectionProtection, xssProtection, authenticate],
    handler: async (request, reply) => {
      try {
        const { username, newUsername } = request.body;

        if (!username || !newUsername) {
          return reply.code(400).send({ error: 'Username and new username required' });
        }

        const updatedUser = await AuthService.updateUser(username, newUsername);
        return reply.send({ success: true, user: updatedUser });
      } catch (err) {
        reply.code(400).send({ error: err.message });
      }
    }
  });

  fastify.put('/password', {
    preHandler: [sqlInjectionProtection, xssProtection, authenticate],
    handler: async (request, reply) => {
      try {
        const { username, newPassword } = request.body;

        if (!newPassword || newPassword.length < 8) {
          return reply.code(400).send({ error: 'New password is too short' });
        }

        await AuthService.updatePassword(username, newPassword);
        return reply.code(200).send({ success: true, message: 'Password updated' });
      } catch (err) {
        console.error(err);
        return reply.code(500).send({ success: false, error: 'Failed to update password' });
      }
    }
  });

fastify.post('/2fa/setup', {
  preHandler: authenticate,
  handler: async (request, reply) => {
    try {
      const user = request.user;
      if (!user?.id) return reply.code(401).send({ error: 'Unauthorized' });

      // 🔒 Vérifie si 2FA est déjà activée
      const row = dbApi.db.prepare('SELECT two_factor_enabled FROM users WHERE id = ?').get(user.id);
      if (row?.two_factor_enabled) {
        return reply.code(400).send({ error: '2FA déjà activée' });
      }

      const secret = speakeasy.generateSecret({
        name: `Transcendence (${user.username})`,
      });

      if (!secret.otpauth_url) throw new Error('Missing otpauth_url');

      dbApi.db.prepare('UPDATE users SET two_factor_secret = ? WHERE id = ?')
        .run(secret.base32, user.id);

      const qrCode = await qrcode.toDataURL(secret.otpauth_url);

      return reply.send({ qrCode });

    } catch (err) {
      console.error('❌ Erreur setup 2FA:', err);
      reply.code(500).send({ error: 'Failed to setup 2FA' });
    }
  }
});


  fastify.post('/2fa/verify', {
    preHandler: [sqlInjectionProtection, xssProtection, authenticate],
    handler: async (request, reply) => {
      try {
        const { token } = request.body;
        const userId = request.user.id;

        if (!token) {
          return reply.code(400).send({ error: 'Token is required' });
        }

        const row = dbApi.db.prepare('SELECT two_factor_secret FROM users WHERE id = ?').get(userId);
        if (!row || !row.two_factor_secret) {
          return reply.code(400).send({ error: '2FA secret not found' });
        }

        const verified = speakeasy.totp.verify({
          secret: row.two_factor_secret,
          encoding: 'base32',
          token,
          window: 1
        });

        if (!verified) {
          return reply.code(401).send({ error: 'Invalid 2FA token' });
        }

        dbApi.db.prepare('UPDATE users SET two_factor_enabled = 1 WHERE id = ?').run(userId);
        return reply.send({ success: true });
      } catch (err) {
        console.error('2FA verify error:', err);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  });

  fastify.post('/2fa/verify-login', {
  handler: async (request, reply) => {
    try {
      const { userId, token: code } = request.body;

      if (!userId || !code) {
        return reply.code(400).send({ error: 'Missing userId or token' });
      }

      const row = dbApi.db.prepare('SELECT two_factor_secret FROM users WHERE id = ?').get(userId);
      if (!row || !row.two_factor_secret) {
        return reply.code(400).send({ error: '2FA not configured for this user' });
      }

      const verified = speakeasy.totp.verify({
        secret: row.two_factor_secret,
        encoding: 'base32',
        token: code,
        window: 1
      });

      if (!verified) {
        return reply.code(401).send({ error: 'Invalid 2FA token' });
      }

      const token = jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const user = dbApi.db.prepare('SELECT username FROM users WHERE id = ?').get(userId);

      return reply.send({
        success: true,
        token,
        user: {
          id: userId,
          username: user.username
        }
      });

    } catch (err) {
      console.error('2FA login verify error:', err);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  }
});

}

module.exports = authRoutes;

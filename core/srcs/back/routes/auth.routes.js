const AuthService = require('../services/auth.service');
const jwt = require('jsonwebtoken');
const dbApi = require('../db');
const authenticate = require('../middleware/authenticate');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { sqlInjectionProtection, xssProtection } = require('../middleware/security.middleware');

async function authRoutes(fastify, options) {

  // GET /auth/me - Récupérer les informations utilisateur
  fastify.get('/me', {
    preHandler: [authenticate],
    handler: async (req, reply) => {
      try {
        const id = req.user.id;
        const user = dbApi.db.prepare(
          'SELECT id, username, avatar, two_factor_enabled FROM users WHERE id = ?'
        ).get(id);

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
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  });

  // POST /auth/register - Inscription utilisateur
  fastify.post('/register', {
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
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  });

  // POST /auth/login - Connexion utilisateur
  fastify.post('/login', {

    handler: async (request, reply) => {
      try {
        const { username, password } = request.body;
        const user = await AuthService.loginUser(username, password);

        if (user.twoFactorEnabled) {
          return reply.code(200).send({
            success: true,
            message: '2FA required',
            twofa: true,
            userId: user.id,
            username: user.username
          });
        }

        const token = jwt.sign(
          { id: user.id, username: user.username },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
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
        return reply.code(401).send({
          success: false,
          error: error.message
        });
      }
    }
  });

  // PUT /auth/update - Modifier le nom d'utilisateur
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

  // PUT /auth/password - Modifier le mot de passe
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
        return reply.code(500).send({ success: false, error: 'Failed to update password' });
      }
    }
  });

  // POST /auth/2fa/setup - Génération du QR code pour activer le 2FA
  fastify.post('/2fa/setup', {
    preHandler: authenticate,
    handler: async (request, reply) => {
      try {
        const user = request.user;
        if (!user?.id) return reply.code(401).send({ error: 'Unauthorized' });

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
        return reply.code(500).send({ error: 'Failed to setup 2FA' });
      }
    }
  });

  // POST /auth/2fa/verify - Vérification du token pour activer le 2FA
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
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  });

  // POST /auth/2fa/verify-login - Vérification du 2FA pendant le login
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
          { expiresIn: process.env.JWT_EXPIRES_IN }
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
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  });

  // === FRIENDSHIP ROUTES ===

fastify.post('/friends/add', {
  preHandler: [authenticate],
  handler: async (req, reply) => {
    const { username } = req.body;
    const userId = req.user.id;

    if (!username) {
      return reply.code(400).send({ error: 'Username is required' });
    }

    const friend = dbApi.db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (!friend) {
      return reply.code(404).send({ error: 'User not found' });
    }

    if (friend.id === userId) {
      return reply.code(400).send({ error: 'Cannot add yourself as a friend' });
    }

    const exists = dbApi.db.prepare(`
      SELECT 1 FROM friends
      WHERE user_id = ? AND friend_id = ?
    `).get(userId, friend.id);

    if (exists) {
      return reply.code(400).send({ error: 'Friend already added' });
    }

    dbApi.db.prepare(`
      INSERT INTO friends (user_id, friend_id, status)
      VALUES (?, ?, 'accepted')
    `).run(userId, friend.id);

    return reply.send({ success: true, message: 'Friend added successfully' });
  }
});

fastify.get('/friends', {
  preHandler: [authenticate],
  handler: async (request, reply) => {
    try {
      const userId = request.user.id;
      console.log('Fetching friends for user ID:', userId);

      const rows = dbApi.db.prepare(`
  SELECT u.id, u.username,
         CASE
           WHEN u.avatar IS NOT NULL AND u.avatar != ''
           THEN '/avatars/' || u.avatar
           ELSE '/avatars/default.png'
         END AS avatar
  FROM friends f
  JOIN users u ON u.id = f.friend_id
  WHERE f.user_id = ?
`).all(userId);


      console.log('Friends found:', rows);
      return reply.send(rows);
    } catch (err) {
      console.error('❌ Error fetching friends:', err);  // 👈 LOG PRÉCIS
      return reply.code(500).send({ error: 'Failed to fetch friends' });
    }
  }
});

fastify.get('/auth/friends', {
  preHandler: authenticate,
  handler: async (request, reply) => {
    try {
      const userId = request.user.id;
      console.log('🔎 Récupération des amis pour l’utilisateur', userId);

      const rows = db.prepare(`
        SELECT u.id, u.username
        FROM friends f
        JOIN users u ON u.id = f.friend_id
        WHERE f.user_id = ?
      `).all(userId);
console.log('📥 Headers reçus:', request.headers);

      console.log('👥 Amis trouvés :', rows);
      return rows;
    } catch (err) {
  console.error('❌ Erreur dans /auth/friends:', err.stack || err.message || err);
  reply.code(500).send({ error: 'Erreur serveur', details: err.message });
}

  }
});

// Route pour bloquer un utilisateur
fastify.post('/block', {
  preHandler: [fastify.authenticate],
  handler: async (req, reply) => {
    const blockerId = req.user.id;
    const { blockedId } = req.body;
console.log(`[BLOCK] ${blockerId} → ${blockedId}`);

    if (!blockedId) {
      return reply.code(400).send({ error: 'blockedId is required' });
    }

    try {
      const stmt = dbApi.db.prepare('INSERT OR IGNORE INTO blocks (blocker_id, blocked_id) VALUES (?, ?)');
      stmt.run(blockerId, blockedId);
      return reply.code(201).send({ message: 'User blocked successfully' });
    } catch (err) {
      console.error('Error blocking user:', err.message);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  }
});

fastify.delete('/friends/remove', {
  preHandler: [authenticate],
  handler: async (req, reply) => {
    const { friendId } = req.body;
    const userId = req.user.id;

    if (!friendId) {
      return reply.code(400).send({ error: 'friendId is required' });
    }

    const result = dbApi.db.prepare(`
      DELETE FROM friends WHERE user_id = ? AND friend_id = ?
    `).run(userId, friendId);

    return reply.send({ success: true, removed: result.changes > 0 });
  }
});

}

module.exports = authRoutes;

const { db } = require('../db');
const JWTAuthentication = require('../middleware/jwt/jwt.auth');
const SanitizeService = require('../middleware/security.middleware');

async function profileRoutes(fastify, options) {
    // ─── 1) Historique du profil connecté ───────────────────────────────────────
    fastify.get('/profile/history', {
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: async (request, reply) => {
            try {
                const userId = request.user.id;

                const rows = db.prepare(`
                    SELECT
                        match_id,
                        user_id,
                        opponent,
                        result,
                        score_user,
                        score_opponent,
                        played_at
                    FROM match_history
                    WHERE user_id = ?
                    ORDER BY played_at DESC
                `).all(userId);

                return reply.send(rows);
            } catch (err) {
                request.log.error(err);
                return reply.code(500).send({ error: 'Failed to load match history.' });
            }
        }
    });

    // ─── 2) Historique d'un autre utilisateur ───────────────────────────────────
    fastify.get('/auth/users/:id/history', {
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: async (request, reply) => {
            try {
                const friendId = Number(request.params.id);

                if (isNaN(friendId)) {
                    return reply.code(400).send({ error: 'Invalid user ID' });
                }

                const rows = db.prepare(`
                    SELECT
                        match_id,
                        user_id,
                        opponent,
                        result,
                        score_user,
                        score_opponent,
                        played_at
                    FROM match_history
                    WHERE user_id = ?
                    ORDER BY played_at DESC
                `).all(friendId);

                return reply.send(rows);
            } catch (err) {
                request.log.error(err);
                return reply.code(500).send({ error: 'Failed to load match history for user.' });
            }
        }
    });
}

module.exports = profileRoutes;
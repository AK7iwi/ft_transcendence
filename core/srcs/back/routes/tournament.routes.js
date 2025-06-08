const { getUserByUsernameforMat, recordGameResultTournament, recordMatchHistory } = require('../db');
const JWTAuthentication = require('../middleware/jwt/jwt.auth');
const SanitizeService = require('../middleware/security.middleware');
const schemas = require('../schemas/tournament.schemas');
async function tournamentRoutes(fastify, options) {
    fastify.post('/game-result', {
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        schema: schemas.recordGameResult,
        handler: async (request, reply) => {
            const { winnerId, loserId } = request.body;

            if (typeof winnerId !== 'number' || typeof loserId !== 'number') {
                return reply.code(400).send({ success: false, message: 'Invalid IDs' });
            }

            try {
                recordGameResultTournament(winnerId, loserId);
                console.log(`[✅ DB] Game recorded: winner=${winnerId}, loser=${loserId}`);
                return reply.send({ success: true });
            } catch (err) {
                console.error('[❌ DB] Failed to record game result:', err);
                return reply.code(500).send({ success: false, message: 'DB error' });
            }
        }
    });

    fastify.post('/match-history', {
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        schema: schemas.recordMatchHistory,
        handler: async (request, reply) => {
            const { userId, opponent, result, scoreUser, scoreOpponent } = request.body;

            if (
                typeof userId !== 'number' ||
                typeof opponent !== 'string' ||
                !['win', 'loss'].includes(result) ||
                typeof scoreUser !== 'number' ||
                typeof scoreOpponent !== 'number'
            ) {
                return reply.code(400).send({ success: false, message: 'Invalid match history data' });
            }

            try {
                recordMatchHistory({ userId, opponent, result, scoreUser, scoreOpponent, playedAt: new Date().toISOString() });
                console.log(`[✅ DB] Match history recorded for user ${userId} vs ${opponent}`);
                return reply.send({ success: true });
            } catch (err) {
                console.error('[❌ DB] Failed to record match history:', err);
                return reply.code(500).send({ success: false, message: 'DB error' });
            }
        }
    });

    fastify.post('/validate-username', {
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        schema: schemas.validateUsername,
        handler: async (request, reply) => {
            console.log('[ROUTE] /tournament/validate-username hit');
            const username = (request.body.username || '').trim();

            if (!username || typeof username !== 'string') {
                return reply.code(400).send({ valid: false, message: 'Username is required' });
            }

            try {
                const user = getUserByUsernameforMat(username);
                console.log('[CHECK] looking up username:', username, '→ found:', !!user);
                console.log('[CHECK] Result from DB for', username, ':', user);

                if (user) {
                    return reply.send({
                        valid: true,
                        id: user.id,
                        avatar: user.avatar || null, // Make sure your DB returns an avatar field
                        wins: user.wins,
                        losses: user.losses
                    });
                } else {
                    return reply.send({ valid: false, message: 'Username not found' });
                }
            } catch (err) {
                console.error('[Validate Username Error]', err);
                return reply.code(500).send({ valid: false, message: 'Internal server error' });
            }
        }
    });
}

module.exports = tournamentRoutes;
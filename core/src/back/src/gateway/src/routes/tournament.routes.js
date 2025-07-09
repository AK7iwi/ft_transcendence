const tournamentSchema = require('../schemas/tournament.schema');
const SanitizeService = require('../security/middleware/sanitize/sanitize.service');
const JWTAuthentication = require('../security/middleware/jwt/jwt.auth');

module.exports = async function (fastify, opts) {

    fastify.post('/game-result', {
        schema: tournamentSchema.gameResult,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: async (request, reply) => {
            try {
                const { data, status } = await fastify.serviceClient.post(
                    `${process.env.TOURNAMENT_SERVICE_URL}/game-result`,
                    request.body,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.code(status).send(data);
            } catch (error) {
                request.log.error(error);
                return reply.code(error.status).send({
                    success: false,
                    message: error.message || 'Failed to create game result'
                });
            }
        }
    });

    fastify.post('/match-history', {
        schema: tournamentSchema.createMatchHistory,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: async (request, reply) => {
            try {
                const { data, status } = await fastify.serviceClient.post(
                    `${process.env.TOURNAMENT_SERVICE_URL}/match-history`,
                    request.body,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.code(status).send(data);
            } catch (error) {
                request.log.error(error);
                return reply.code(error.status).send({
                    success: false,
                    message: error.message || 'Failed to create match history'
                });
            }
        }
    });

    fastify.get('/validate-username', {
        schema: tournamentSchema.validateUsername,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: async (request, reply) => {
            try {
                const { data, status } = await fastify.serviceClient.get(
                    `${process.env.TOURNAMENT_SERVICE_URL}/validate-username`,
                    request.body,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.code(status).send(data);
            } catch (error) {
                request.log.error(error);
                return reply.code(error.status).send({
                    success: false,
                    message: error.message || 'Failed to validate username'
                });
            }
        }
    });
}   
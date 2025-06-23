const tournamentSchema = require('../schemas/tournament.schema');
const SanitizeService = require('../security/middleware/sanitize.service');
const JWTAuthentication = require('../security/middleware/jwt/jwt.auth');

module.exports = async function (fastify, opts) {
    fastify.post('/game-result', {
        schema: tournamentSchema.gameResult,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.post(
                    `${process.env.TOURNAMENT_SERVICE_URL}/game-result`,
                    request.body,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.code(200).send(response);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.status || 400;
                const errorMessage = error.message || 'Failed to create game result';
                return reply.code(statusCode).send({
                    success: false,
                    message: errorMessage
                });
            }
        }
    });

    fastify.post('/match-history', {
        schema: tournamentSchema.createMatchHistory,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.post(
                    `${process.env.TOURNAMENT_SERVICE_URL}/match-history`,
                    request.body,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.code(201).send(response);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.status || 400;
                const errorMessage = error.message || 'Failed to create match history';
                return reply.code(statusCode).send({
                    success: false,
                    message: errorMessage
                });
            }
        }
    });

    fastify.get('/validate-username', {
        schema: tournamentSchema.validateUsername,
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.get(
                    `${process.env.TOURNAMENT_SERVICE_URL}/validate-username`,
                    {
                        params: { username: request.query.username },
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.code(200).send(response);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.status || 400;
                const errorMessage = error.message || 'Failed to validate username';
                return reply.code(statusCode).send({
                    valid: false,
                    message: errorMessage
                });
            }
        }
    });
}   
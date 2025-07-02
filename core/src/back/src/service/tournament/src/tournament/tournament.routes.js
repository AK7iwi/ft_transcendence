const tournamentSchema = require('./tournament.schema');
const JWTAuthentication = require('../security/middleware/jwt/jwt.auth');
const TournamentController = require('./tournament.controller');

async function tournamentRoutes(fastify, options) {
    fastify.post('/game-result', {
        schema: tournamentSchema.gameResult,
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: TournamentController.createGameResult
    });

    fastify.post('/match-history', {
        schema: tournamentSchema.matchHistory,
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: TournamentController.createMatchHistory
    });

    fastify.get('/validate-username', {
        schema: tournamentSchema.validateUsername,
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: TournamentController.validateUsername
    });
}

module.exports = tournamentRoutes;

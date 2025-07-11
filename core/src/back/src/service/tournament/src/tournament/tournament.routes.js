const JWTAuthentication = require('../security/middleware/jwt/jwt.auth');
const TournamentController = require('./tournament.controller');

async function tournamentRoutes(fastify, options) {
    fastify.post('/game-result', {
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: TournamentController.createGameResult
    });

    fastify.post('/match-history', {
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: TournamentController.createMatchHistory
    });

    fastify.get('/validate-username', {
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: TournamentController.validateUsername
    });
}

module.exports = tournamentRoutes;

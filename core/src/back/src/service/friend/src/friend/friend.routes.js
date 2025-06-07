const friendSchema = require('./friend.schema');
const FriendController = require('./friend.controller');
const JWTAuthentication = require('../../security/middleware/jwt/jwt.auth');

async function friendRoutes(fastify, options) {
    // Add a friend
    fastify.post('/add', {
        schema: friendSchema.addFriend,
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: FriendController.addFriend
    });
}

module.exports = friendRoutes;

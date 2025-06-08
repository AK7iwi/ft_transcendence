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

    fastify.get('/friends', {
        schema: friendSchema.getFriends,
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: FriendController.getFriends
    });

    fastify.get('/blocked', {
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: FriendController.getBlockedUsers
    });

    fastify.post('/block', {
        schema: friendSchema.blockUser,
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: FriendController.blockUser
    });

    fastify.post('/unblock', {
        schema: friendSchema.unblockUser,
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: FriendController.unblockUser
    });
}

module.exports = friendRoutes;

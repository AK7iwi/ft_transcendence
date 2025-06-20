const friendSchema = require('./friend.schema');
const FriendController = require('./friend.controller');
const JWTAuthentication = require('../security/middleware/jwt/jwt.auth');

async function friendRoutes(fastify, options) {
    // Add a friend
    fastify.post('/add', {
        schema: friendSchema.addFriend,
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: FriendController.addFriend
    });

    // Get friends
    fastify.get('/friends', {
        schema: friendSchema.getFriends,
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: FriendController.getFriends
    });

    // Get blocked users
    fastify.get('/blocked', {
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: FriendController.getBlockedUsers
    });

    // Block a user
    fastify.post('/block', {
        schema: friendSchema.blockUser,
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: FriendController.blockUser
    });

    // Unblock a user
    fastify.post('/unblock', {
        schema: friendSchema.unblockUser,
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: FriendController.unblockUser
    });

    // Remove a friend
    fastify.delete('/remove', {
        schema: friendSchema.removeFriend,
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: FriendController.removeFriend
    });
}

module.exports = friendRoutes;

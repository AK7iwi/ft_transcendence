const JWTAuthentication = require('../security/middleware/jwt/jwt.auth');
const FriendController = require('./friend.controller');

async function friendRoutes(fastify, options) {
    // Add a friend
    fastify.post('/add', {
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: FriendController.addFriend
    });

    // Get friends
    fastify.get('/friends', {
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
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: FriendController.blockUser
    });

    // Unblock a user
    fastify.post('/unblock', {
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: FriendController.unblockUser
    });

    // Remove a friend
    fastify.delete('/remove', {
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: FriendController.removeFriend
    });
}

module.exports = friendRoutes;

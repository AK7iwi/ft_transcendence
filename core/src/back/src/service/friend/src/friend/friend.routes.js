const friendSchema = require('./friend.schema');
const JWTAuthentication = require('../security/middleware/jwt/jwt.auth');
const SanitizeService = require('../security/middleware/sanitize/sanitize.service');
const FriendController = require('./friend.controller');

module.exports = async function (fastify, opts) {
    fastify.post('/add', {
        schema: friendSchema.addFriend,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: FriendController.addFriend
    });

    // Get friends
    fastify.get('/friends', {
        schema: friendSchema.getFriends,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: FriendController.getFriends
    });

    // Get blocked users
    fastify.get('/blocked', {
        schema: friendSchema.getBlocked,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: FriendController.getBlockedUsers
    });

    fastify.post('/block', {
        schema: friendSchema.blockUser,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: FriendController.blockUser
    });

    fastify.post('/unblock', {
        schema: friendSchema.unblockUser,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: FriendController.unblockUser
    });

    fastify.delete('/remove', {
        schema: friendSchema.removeFriend,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: FriendController.removeFriend
    });
};

const AvatarController = require('./avatar.controller');
const JWTAuthentication = require('../security/middleware/jwt/jwt.auth');

module.exports = async function (fastify, opts) {
    // Upload avatar route
    fastify.post('/upload-avatar', {
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: AvatarController.uploadAvatar
    });
};

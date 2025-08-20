const TwoFactorService = require('./two-factor.service');
const JWTService = require('../security/middleware/jwt/jwt.service');

class TwoFactorController {
    async setup2FA(request, reply) {
        const userId = request.user.id;
        const username = request.user.username;
        
        await TwoFactorService.checkIf2FAEnabled(userId, false);
        const secret = await TwoFactorService.generateSecret(username);
        await TwoFactorService.update2FASecret(userId, secret.base32, request.server.serviceClient);
        const qrCode = await TwoFactorService.generateQRCode(secret);

        return reply.code(200).send({
            success: true,
            message: '2FA setup initiated',
            data: {
                user: {
                    username: username,
                    qrCode: qrCode
                }
            }
        });
    }

    async verify_setup2FA(request, reply) {
        const { token } = request.body;
        const userId = request.user.id;
        const username = request.user.username;

        const secret = await TwoFactorService.get2FASecret(userId);
        await TwoFactorService.verify2FAToken(secret, token);
        await TwoFactorService.enable2FA(userId, request.server.serviceClient);

        return reply.code(201).send({
            success: true,
            message: '2FA verification successful',
            data: {
                user: {
                    username: username
                }
            }
        });
    }

    //need to send userId in the body or params(from the login route)
    async verify_login2FA(request, reply) {
        const { userId, token } = request.body;

        // always true but used to get the user
        const user = await TwoFactorService.checkIf2FAEnabled(userId, true);
        const secret = await TwoFactorService.get2FASecret(userId);
        await TwoFactorService.verify2FAToken(secret, token);
        const jwtToken = JWTService.generateJWTToken(user);

        return reply.code(200).send({
            success: true,
            message: '2FA verification successful',
            data: {
                user: {
                    username: user.username,
                    token: jwtToken
                }
            }
        });
    }

    async disable2FA(request, reply) {
        const userId = request.user.id;
        const username = request.user.username;

        await TwoFactorService.checkIf2FAEnabled(userId, true);
        await TwoFactorService.disable2FA(userId, request.server.serviceClient);
            
        return reply.code(200).send({
            success: true,
            message: '2FA disabled successfully',
            data: {
                user: {
                    username: username
                }
            }
        });
    }
}

module.exports = new TwoFactorController();
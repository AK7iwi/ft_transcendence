const TwoFactorService = require('./two-factor.service');
const JWTService = require('../security/middleware/jwt/jwt.service');

class TwoFactorController {
    async setup2FA(request, reply) {
        const userId = request.user.id;
        const username = request.user.username;

        console.log("================SETUP 2FA=================");
        console.log(userId);
        console.log(username);
        console.log("===========================================");
        
        await TwoFactorService.checkIf2FAEnabled(userId, false);
        const secret = await TwoFactorService.generateSecret(username);
        console.log("SECRET: ", secret);
        console.log("SECRET.SECRET: ", secret.base32);
        console.log("SECRET.BASE64: ", secret.base64);
        await TwoFactorService.update2FASecret(userId, secret.base64, request.server.serviceClient);
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

        const secret = await TwoFactorService.getTwoFactorSecret(userId);
        console.log("================ VERIFY 2FA =================");
        console.log("SECRET: ", secret);
        await TwoFactorService.verify2FAToken(secret, token);
        console.log("================ VERIFY 2FA 2 =================");
        await TwoFactorService.enable2FA(userId, request.server.serviceClient);
        console.log("================ VERIFY 2FA 3 =================");

        return reply.code(200).send({
            success: true,
            message: '2FA verification successful',
            data: {
                user: {
                    id: userId,
                    username: username
                }
            }
        });
    }

    async verify_login2FA(request, reply) {
        const { token } = request.body;
        const userId = request.user.id;
        const username = request.user.username;

        const secret = await TwoFactorService.getTwoFactorSecret(userId);
        await TwoFactorService.verify2FAToken(secret, token);
        const jwtToken = JWTService.generateJWTToken({
            id: userId,
            username: username
        });

        return reply.code(200).send({
            success: true,
            message: '2FA verification successful',
            data: {
                user: {
                    id: userId,
                    username: username
                },
                token: jwtToken
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
                    id: userId,
                    username: username
                }
            }
        });
    }
}

module.exports = new TwoFactorController();
const TwoFactorService = require('./two-factor.service');
const JWTService = require('../security/middleware/jwt/jwt.service');

class TwoFactorController {
    async setup2FA(request, reply) {
        const userId = request.user.id;
        const username = request.user.username; 

        //check if 2fa is already enabled
        const twoFactorEnabled = await TwoFactorService.getTwoFactorEnabled(userId);
        if (twoFactorEnabled) {
            return reply.code(400).send({
                success: false,
                message: '2FA already setup'
            });
        }

        // Generate secret
        const secret = await TwoFactorService.generateSecret(username);
            
        // Store secret temporarily (don't enable 2FA yet)
        await TwoFactorService.store2FASecret(userId, secret.base32, request.server.serviceClient);

        // Generate QR code
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

        if (!secret) {
            return reply.code(400).send({
                success: false,
                message: '2FA not set up'
            });
        }

        const isValid = await TwoFactorService.verify2FAToken(secret, token);
        if (!isValid) {
            return reply.code(400).send({
                success: false,
                message: 'Invalid 2FA token'
            });
        }

            // Always enable 2FA after successful verification
        await TwoFactorService.enable2FA(userId, request.server.serviceClient);

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
        if (!secret) {
            return reply.code(400).send({
                success: false,
                message: '2FA not set up'
            });
        }

        const isValid = await TwoFactorService.verify2FAToken(secret, token);
        if (!isValid) {
            return reply.code(400).send({
                success: false,
                message: 'Invalid 2FA token'
            });
        }
            
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

        //verify the token before disable
        const secret = await TwoFactorService.getTwoFactorSecret(userId);
        if (!secret) {
            return reply.code(400).send({
                success: false,
                message: '2FA not set up'
            });
        }

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
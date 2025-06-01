const TwoFactorService = require('../services/two-factor.service');

class TwoFactorController {
    async setup2FA(request, reply) {
        try {
            const userId = request.user.id;

            //check if 2fa is already enabled
            const twoFactorEnabled = await TwoFactorService.getTwoFactorEnabled(userId);
            if (twoFactorEnabled) {
                return reply.code(400).send({
                    success: false,
                    message: '2FA already setup'
                });
            }
            const secret = await TwoFactorService.generateSecret(request.user.username);
            
            // Store secret temporarily (don't enable 2FA yet)
            await AuthService.store2FASecret(userId, secret.base32);

            // Generate QR code
            const qrCode = await TwoFactorService.generateQRCode(secret);

            return reply.code(200).send({
                success: true,
                message: '2FA setup initiated',
                data: {
                    username: request.user.username,
                    qrCode: qrCode
                }
            });
        } catch (error) {
            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    }

    async verify2FA(request, reply) {
        try {
            const { userId, token } = request.body;
            const secret = await TwoFactorService.getTwoFactorSecret(userId);
            
            if (!secret) {
                return reply.code(400).send({
                    success: false,
                    message: '2FA not set up'
                });
            }

            const isValid = await TwoFactorService.verifyToken(secret, token);
            if (!isValid) {
                return reply.code(400).send({
                    success: false,
                    message: 'Invalid 2FA token'
                });
            }

            // If this is part of setup, enable 2FA
            if (request.body.setup) {
                await TwoFactorService.enable2FA(userId);
            }

            // Generate JWT token
            const jwtToken = JWTService.generateToken({
                id: user.id,
                username: user.username
            });

            return reply.code(200).send({
                success: true,
                message: '2FA verification successful',
                data: {
                    token: jwtToken
                }
            });
        } catch (error) {
            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    }

    async disable2FA(request, reply) {
        try {
            const userId = request.user.id;
            await TwoFactorService.disable2FA(userId);
            
            return reply.code(200).send({
                success: true,
                message: '2FA disabled successfully'
            });
        } catch (error) {
            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new TwoFactorController();
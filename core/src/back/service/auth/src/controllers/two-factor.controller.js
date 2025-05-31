const TwoFactorService = require('../services/two-factor.service');

class AuthController {
    // Existing methods...

    async setup2FA(request, reply) {
        try {
            const userId = request.user.id;
            const secret = await TwoFactorService.generateSecret();
            const qrCode = await TwoFactorService.generateQRCode(secret);
            
            // Store secret temporarily (don't enable 2FA yet)
            await AuthService.store2FASecret(userId, secret.base32);
            
            return reply.code(200).send({
                success: true,
                message: '2FA setup initiated',
                data: {
                    secret: secret.base32,
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
            const user = await AuthService.getUserById(userId);
            
            if (!user.two_factor_secret) {
                return reply.code(400).send({
                    success: false,
                    message: '2FA not set up'
                });
            }

            const isValid = await TwoFactorService.verifyToken(user.two_factor_secret, token);
            if (!isValid) {
                return reply.code(400).send({
                    success: false,
                    message: 'Invalid 2FA token'
                });
            }

            // If this is part of setup, enable 2FA
            if (request.body.setup) {
                await AuthService.enable2FA(userId);
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
            await AuthService.disable2FA(userId);
            
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

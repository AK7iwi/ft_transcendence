const TwoFactorService = require('./two-factor.service');
const JWTService = require('../../security/middleware/jwt/jwt.service');

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
            await TwoFactorService.store2FASecret(userId, secret.base32, request.server.serviceClient);

            // Generate QR code
            const qrCode = await TwoFactorService.generateQRCode(secret);

            return reply.code(200).send({
                success: true,
                message: '2FA setup initiated',
                data: {
                    user: {
                        username: request.user.username,
                        qrCode: qrCode
                    }
                }
            });
        } catch (error) {
            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    }

    async verify_setup2FA(request, reply) {
        try {
            const userId = request.user.id;
            //2fa token
            const { token } = request.body;
            if (!token) {
                return reply.code(400).send({
                    success: false,
                    message: 'Token is required'
                });
            }

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

            // If this is part of setup, enable 2FA
            if (request.body.setup) {
                await TwoFactorService.enable2FA(userId, request.server.serviceClient);
            }

            return reply.code(200).send({
                success: true,
                message: '2FA verification successful',
                data: {
                    user: {
                        username: request.user.username
                    }
                }
            });
        } catch (error) {
            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    }

    async verify_login2FA(request, reply) {
        try {
            const userId = request.user.id;

            const { token } = request.body;
            if (!token) {
                return reply.code(400).send({
                    success: false,
                    message: 'Token is required'
                });
            }

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
            
            const jwtToken = JWTService.generateJwtToken({
                id: userId,
                username: request.user.username
            });

            return reply.code(200).send({
                success: true,
                message: '2FA verification successful',
                data: {
                    user: {
                        id: userId,
                        username: request.user.username
                    },
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

            const { token } = request.body;
            if (!token) {
                return reply.code(400).send({
                    success: false,
                    message: 'Token is required'
                });
            }
            
            await TwoFactorService.disable2FA(userId, request.server.serviceClient);
            
            return reply.code(200).send({
                success: true,
                message: '2FA disabled successfully',
                data: {
                    user: {
                        id: userId,
                        username: request.user.username
                    }
                }
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
const TwoFactorService = require('./two-factor.service');
const JWTService = require('../../security/middleware/jwt/jwt.service');
const speakeasy = require('speakeasy'); //to delete

class TwoFactorController {
    async setup2FA(request, reply) {
        try {
            const userId = request.user.id;
            const username = request.user.username; 

            //check if 2fa is already enabled
            const twoFactorEnabled = await TwoFactorService.getTwoFactorEnabled(userId);
            console.log(twoFactorEnabled);
            if (twoFactorEnabled) {
                return reply.code(400).send({
                    success: false,
                    message: '2FA already setup'
                });
            }
            const secret = await TwoFactorService.generateSecret(username);
            
            // Store secret temporarily (don't enable 2FA yet)
            await TwoFactorService.store2FASecret(userId, secret.base32, request.server.serviceClient);

            // Generate QR code
            const qrCode = await TwoFactorService.generateQRCode(secret);

            // Generate current token for testing
            const currentToken = speakeasy.totp({
                secret: secret.base32,
                encoding: 'base32'
            });

            return reply.code(200).send({
                success: true,
                message: '2FA setup initiated',
                data: {
                    user: {
                        username: username,
                        qrCode: qrCode,
                        currentToken: currentToken
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
            const { token } = request.body;
            const userId = request.user.id;
            const username = request.user.username; 

            console.log('Verifying 2FA setup:', {
                userId,
                username,
                token
            });

            const secret = await TwoFactorService.getTwoFactorSecret(userId);
            console.log('Retrieved secret:', secret);

            if (!secret) {
                return reply.code(400).send({
                    success: false,
                    message: '2FA not set up'
                });
            }

            const isValid = await TwoFactorService.verify2FAToken(secret, token);
            console.log('Token validation result:', isValid);

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
        } catch (error) {
            console.error('2FA verification error:', error);
            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    }

    async verify_login2FA(request, reply) {
        try {
            const { token } = request.body;
            const userId = request.user.id;
            const username = request.user.username;  // Get username from JWT token

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
            const username = request.user.username;  // Get username from JWT token

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
        } catch (error) {
            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new TwoFactorController();
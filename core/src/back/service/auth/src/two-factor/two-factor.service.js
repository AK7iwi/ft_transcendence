const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const DbUpdate = require('../database/db_models/db.update');
const DbGetter = require('../database/db_models/db.getter');

class TwoFactorService {
    static async generateSecret(username) {
        try {
            const secret = speakeasy.generateSecret({
                name: 'Transcendence (' + username + ')'
            });

            if (!secret.otpauth_url) {
                throw new Error('Missing otpauth_url');
            }

            return secret;
        } catch (error) {
            throw new Error('Failed to generate secret');
        }
    }

    static async generateQRCode(secret) {
        try {
            return await QRCode.toDataURL(secret.otpauth_url);
        } catch (error) {
            throw new Error('Failed to generate QR code');
        }
    }

    static async verify2FAToken(secret, token) {
        try {
            if (!secret) {
                throw new Error('No 2FA secret found');
            }

            console.log('Verifying token:', {
                secret,
                token,
                encoding: 'base32'
            });

            const result = speakeasy.totp.verify({
                secret: secret,
                encoding: 'base32',
                token: token,
                window: 1 // Allow 30 seconds clock skew
            });

            console.log('Verification result:', result);
            return result;
        } catch (error) {
            console.error('Token verification error:', error);
            throw new Error('Failed to verify token');
        }
    }

    static async store2FASecret(userId, secret, serviceClient) {
        try {
            //send secret to user
            await serviceClient.post(`${process.env.USER_SERVICE_URL}/user/internal/update2FASecret`, {
                userId: userId,
                secret: secret
            });

            return await DbUpdate.update2FASecret(userId, secret);
        } catch (error) {
            throw new Error('Failed to store 2FA secret');
        }
    }

    static async enable2FA(userId, serviceClient) {
        try {
            // First enable 2FA in the user service
            await serviceClient.post(`${process.env.USER_SERVICE_URL}/user/internal/enable2FA`, {
                userId: userId
            }); 

            return await DbUpdate.enable2FA(userId);

        } catch (error) {
            console.error('Enable 2FA error:', error);
            throw new Error('Failed to enable 2FA');
        }
    }

    static async disable2FA(userId, serviceClient) {
        try {
            //send disable 2fa to user
            await serviceClient.post(`${process.env.USER_SERVICE_URL}/user/internal/disable2FA`, {
                userId: userId
            });

            return await DbUpdate.disable2FA(userId);
        } catch (error) {
            throw new Error('Failed to disable 2FA');
        }
    }

    static async getTwoFactorEnabled(userId) {
        try {
            const enabled = await DbGetter.getTwoFactorEnabled(userId);
            return enabled === 1 || enabled === true; // Handle both SQLite boolean (1) and JavaScript boolean (true)
        } catch (error) {
            throw new Error('Failed to get 2FA enabled');
        }
    }

    static async getTwoFactorSecret(userId) {
        try {
            return await DbGetter.getTwoFactorSecret(userId);
        } catch (error) {
            throw new Error('Failed to get 2FA secret');
        }
    }
}

module.exports = TwoFactorService;

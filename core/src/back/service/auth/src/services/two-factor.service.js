const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

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
            return speakeasy.totp.verify({
                secret: secret,
                encoding: 'base32',
                token: token,
                window: 1 // Allow 30 seconds clock skew
            });
        } catch (error) {
            throw new Error('Failed to verify token');
        }
    }

    static async store2FASecret(userId, secret) {
        try {
            return await DbModel.update2FASecret(userId, secret);
        } catch (error) {
            throw new Error('Failed to store 2FA secret');
        }
    }

    static async enable2FA(userId) {
        try {
            return await DbModel.enable2FA(userId);
        } catch (error) {
            throw new Error('Failed to enable 2FA');
        }
    }

    static async disable2FA(userId) {
        try {
            return await DbModel.disable2FA(userId);
        } catch (error) {
            throw new Error('Failed to disable 2FA');
        }
    }

    static async getTwoFactorEnabled(userId) {
        try {
            return await DbModel.getTwoFactorEnabled(userId);
        } catch (error) {
            throw new Error('Failed to get 2FA enabled');
        }
    }

    static async getTwoFactorSecret(userId) {
        try {
            return await DbModel.getTwoFactorSecret(userId);
        } catch (error) {
            throw new Error('Failed to get 2FA secret');
        }
    }
}

module.exports = TwoFactorService;

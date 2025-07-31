const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const DbAuth = require('../database/db.auth');

class TwoFactorService {
    static async checkIf2FAEnabled(userId) {
        const user = await DbAuth.getUserById(userId);
        if (user.two_factor_enabled) {
            throw new Error('2FA is already enabled');
        }
    }

    static async generateSecret(username) {
        const secret = speakeasy.generateSecret({
            name: 'Transcendence (' + username + ')'
        });

        return secret;
    }

    static async generateQRCode(secret) {
        const qrCode = await QRCode.toDataURL(secret.otpauth_url);

        return qrCode;
    }

    static async store2FASecret(userId, secret, serviceClient) {
        await serviceClient.post(`${process.env.USER_SERVICE_URL}/internal/update2FASecret`, {
            userId: userId,
            secret: secret
        });

        return await DbAuth.update2FASecret(userId, secret);
    }

    static async verify2FAToken(secret, token) {
        const result = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 1
        });

        return result;
    }

    static async enable2FA(userId, serviceClient) {
        await serviceClient.post(`${process.env.USER_SERVICE_URL}/internal/enable2FA`, {
            userId: userId
        });

        return await DbAuth.enable2FA(userId);
    }

    static async disable2FA(userId, serviceClient) {
        await serviceClient.post(`${process.env.USER_SERVICE_URL}/internal/disable2FA`, {
            userId: userId
        });

        return await DbAuth.disable2FA(userId);
    }

    static async getTwoFactorSecret(userId) {
        return await DbAuth.getTwoFactorSecret(userId);
    }
}

module.exports = TwoFactorService;

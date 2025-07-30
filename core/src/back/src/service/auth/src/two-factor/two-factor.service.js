const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const DbAuth = require('../database/db.auth');

class TwoFactorService {
    static async generateSecret(username) {
        const secret = speakeasy.generateSecret({
            name: 'Transcendence (' + username + ')'
        });

        if (!secret.otpauth_url) {
            throw new Error('Missing otpauth_url');
        }

        return secret;
    }

    static async generateQRCode(secret) {
        return await QRCode.toDataURL(secret.otpauth_url);
    }

    static async verify2FAToken(secret, token) {
        if (!secret) {
            throw new Error('No 2FA secret found');
        }

        const result = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 1 // Allow 30 seconds clock skew
        });

        return result;
    }

    static async store2FASecret(userId, secret, serviceClient) {
        //Send secret to user
        await serviceClient.post(`${process.env.USER_SERVICE_URL}/internal/update2FASecret`, {
            userId: userId,
            secret: secret
        });

        return await DbAuth.update2FASecret(userId, secret);
    }

    static async enable2FA(userId, serviceClient) {
        // First enable 2FA in the user service
        await serviceClient.post(`${process.env.USER_SERVICE_URL}/internal/enable2FA`, {
            userId: userId
        }); 

        return await DbAuth.enable2FA(userId);
    }

    static async disable2FA(userId, serviceClient) {
        //send disable 2fa to user
        await serviceClient.post(`${process.env.USER_SERVICE_URL}/internal/disable2FA`, {
            userId: userId
        });

        return await DbAuth.disable2FA(userId);
    }

    // test
    static async getTwoFactorEnabled(userId) {
        const enabled = await DbAuth.getTwoFactorEnabled(userId);
        return enabled === 1 || enabled === true; // Handle both SQLite boolean (1) and JavaScript boolean (true)
    }

    static async getTwoFactorSecret(userId) {
        return await DbAuth.getTwoFactorSecret(userId);
    }
}

module.exports = TwoFactorService;

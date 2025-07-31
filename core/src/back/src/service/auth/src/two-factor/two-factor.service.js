const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const DbAuth = require('../database/db.auth');

class TwoFactorService {
    static async checkIf2FAEnabled(username) {
        //use getUserByUsername
        const user = await DbAuth.getUserByUsername(username);
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

    static async verify2FAToken(secret, token) {
        if (!secret) {
            throw new Error('No 2FA secret found');
        }

        const result = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 1
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

    static async getTwoFactorSecret(userId) {
        return await DbAuth.getTwoFactorSecret(userId);
    }
}

module.exports = TwoFactorService;

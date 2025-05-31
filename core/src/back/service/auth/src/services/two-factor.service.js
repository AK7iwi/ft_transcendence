const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

class TwoFactorService {
    static async generateSecret() {
        const secret = speakeasy.generateSecret({
            name: 'Transcendence'
        });
        return secret;
    }

    static async generateQRCode(secret) {
        return await QRCode.toDataURL(secret.otpauth_url);
    }

    static async verifyToken(secret, token) {
        return speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 1 // Allow 30 seconds clock skew
        });
    }

    static async store2FASecret(userId, secret) {
        return await DbModel.update2FASecret(userId, secret);
    }

    static async enable2FA(userId) {
        return await DbModel.enable2FA(userId);
    }

    static async disable2FA(userId) {
        return await DbModel.disable2FA(userId);
    }
}

module.exports = TwoFactorService;

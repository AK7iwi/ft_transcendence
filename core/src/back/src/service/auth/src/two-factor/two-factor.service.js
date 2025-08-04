const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const DbAuth = require('../database/db.auth');
const { ConflictError } = require('../utils/error/errors');

class TwoFactorService {
    static async checkIf2FAEnabled(userId, shouldBeEnabled) {
        const user = await DbAuth.getUserById(userId);
        if (!shouldBeEnabled && user.two_factor_enabled ) {
            throw new ConflictError('2FA is already enabled', {
                field: 'twoFactorEnabled',
                currentState: true
            });
        }
        else if (shouldBeEnabled && !user.two_factor_enabled) {
            throw new ConflictError('2FA is already disabled', {
                field: 'twoFactorEnabled',
                currentState: false
            });
        }

        return user;
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
        const result = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 1
        });

        if (!result) {
            throw new ConflictError('Invalid 2FA token', {
                field: 'twoFactorToken',
                currentState: false
            });
        }

        return result; 
    }

    static async update2FASecret(userId, secret, serviceClient) {
        await serviceClient.post(`${process.env.USER_SERVICE_URL}/internal/update2FASecret`, {
            userId: userId,
            secret: secret
        });

        await DbAuth.update2FASecret(userId, secret);
    }

    static async enable2FA(userId, serviceClient) {
        await serviceClient.post(`${process.env.USER_SERVICE_URL}/internal/enable2FA`, {
            userId: userId
        });

        await DbAuth.enable2FA(userId);
    }

    static async disable2FA(userId, serviceClient) {
        await serviceClient.post(`${process.env.USER_SERVICE_URL}/internal/disable2FA`, {
            userId: userId
        });

        await DbAuth.disable2FA(userId);
    }

    static async getTwoFactorSecret(userId) {
        const secret = await DbAuth.getTwoFactorSecret(userId);

        return secret;
    }
}

module.exports = TwoFactorService;

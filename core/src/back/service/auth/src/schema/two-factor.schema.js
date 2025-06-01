const twoFactorSchema = {
    setup2FA: {
        body: {
            type: 'object',
            required: [],
            properties: {}
        }
    },
    enable2FA: {
        body: {
            type: 'object',
            required: ['token'],
            properties: {
                token: { type: 'string', minLength: 6, maxLength: 6 }
            }
        }
    },
    verify2FA: {
        body: {
            type: 'object',
            required: ['token'],
            properties: {
                token: { type: 'string', minLength: 6, maxLength: 6 }
            }
        }
    },
    disable2FA: {
        body: {
            type: 'object',
            required: [],
            properties: {}
        }
    }
};

module.exports = twoFactorSchema;
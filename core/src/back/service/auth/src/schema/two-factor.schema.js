const twoFactorSchema = {
    setup2FA: {
        body: {
            type: 'object',
            required: [],
            properties: {}
        }
    },
    verify2FA: {
        body: {
            type: 'object',
            required: ['userId', 'token'],
            properties: {
                userId: { type: 'number' },
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
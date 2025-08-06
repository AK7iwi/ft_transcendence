const twoFactorSchema = {
    setup2FA: {
        body: {
            type: 'object',
            required: [],
            properties: {},
            additionalProperties: false
        }
    },
    verify_setup2FA: {
        body: {
            type: 'object',
            required: ['token'],
            properties: {
                token: { type: 'string', minLength: 6, maxLength: 6 }
            },
            additionalProperties: false
        }
    },
    verify_login2FA: {
        body: {
            type: 'object',
            required: ['userId', 'token'],
            properties: {
                userId: { type: 'string' },
                token: { type: 'string', minLength: 6, maxLength: 6 }
            },
            additionalProperties: false
        }
    },
    disable2FA: {
        body: {
            type: 'object',
            required: [],
            properties: {},
            additionalProperties: false
        }
    }
};

module.exports = twoFactorSchema;
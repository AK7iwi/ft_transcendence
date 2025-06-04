const twoFactorSchema = {
    setup2FA: {
        headers: {
            type: 'object',
            required: ['x-user-id'],
            properties: {
                'x-user-id': { type: 'string', minLength: 1 }
            }
        },
        body: {
            type: 'object',
            required: [],
            properties: {}
        }
    },
    verify_setup2FA: {
        headers: {
            type: 'object',
            required: ['x-user-id'],
            properties: {
                'x-user-id': { type: 'string', minLength: 1 }
            }
        },
        body: {
            type: 'object',
            required: ['token'],
            properties: {
                token: { type: 'string', minLength: 6, maxLength: 6 }
            }
        }
    },
    verify_login2FA: {
        headers: {
            type: 'object',
            required: ['x-user-id'],
            properties: {
                'x-user-id': { type: 'string', minLength: 1 }
            }
        },
        body: {
            type: 'object',
            required: ['token'],
            properties: {
                token: { type: 'string', minLength: 6, maxLength: 6 }
            }
        }
    },
    disable2FA: {
        headers: {
            type: 'object',
            required: ['x-user-id'],
            properties: {
                'x-user-id': { type: 'string', minLength: 1 }
            }
        },
        body: {
            type: 'object',
            required: ['token'],
            properties: {
                token: { type: 'string', minLength: 6, maxLength: 6 }
            }
        }
    }
};

module.exports = twoFactorSchema;
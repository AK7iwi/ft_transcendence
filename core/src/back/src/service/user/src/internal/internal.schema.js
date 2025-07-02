const internalSchema = {
    createUser: {
        body: {
            type: 'object',
            required: ['userId', 'username', 'hashedPassword'],
            properties: {
                userId: { type: 'number' }, 
                username: { 
                    type: 'string', 
                    minLength: 3, 
                    maxLength: 20, 
                    pattern: '^[a-zA-Z0-9_-]+$' 
                },
                hashedPassword: {
                   type: 'string',
                   minLength: 60, // bcrypt hashes are 60 characters
                   maxLength: 60
                }
            },
            additionalProperties: false
        }
    },
    update2FASecret: {
        body: {
            type: 'object',
            required: ['userId', 'secret'],
            properties: {
                userId: { type: 'number' },
                secret: { type: 'string' }
            },
            additionalProperties: false
        }
    },
    enable2FA: {
        body: {
            type: 'object',
            required: ['userId'],
            properties: {
                userId: { type: 'number' }
            },
            additionalProperties: false
        }
    },
    disable2FA: {
        body: {
            type: 'object',
            required: ['userId'],
            properties: {
                userId: { type: 'number' }
            },
            additionalProperties: false
        }
    },
    createMatchHistory: {
        body: {
            type: 'object',
            required: ['userId', 'opponent', 'result', 'scoreUser', 'scoreOpponent', 'playedAt'],
            properties: {
                userId: { type: 'number' },
                opponent: { type: 'string' },
                result: { 
                    type: 'string', 
                    enum: ['win', 'loss'] 
                },
                scoreUser: { type: 'number' },
                scoreOpponent: { type: 'number' },
                playedAt: { type: 'string', format: 'date-time' }
            },
            additionalProperties: false
        }
    }
}

module.exports = internalSchema;
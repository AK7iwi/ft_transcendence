const tournamentSchema = {
    gameResult: {
        body: {
            type: 'object',
            required: ['winnerId', 'loserId'],
            properties: {
                winnerId: { type: 'number' },
                loserId: { type: 'number' }
            }
        },
        response: {
            201: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                }
            },
            400: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                }
            }
        }
    },
    createMatchHistory: {
        body: {
            type: 'object',
            required: ['userId', 'opponent', 'result', 'scoreUser', 'scoreOpponent'],
            properties: {
                userId: { type: 'number' },
                opponent: { type: 'string' },
                result: { type: 'string', enum: ['win', 'loss'] },
                scoreUser: { type: 'number' },
                scoreOpponent: { type: 'number' }
            }
        },
        response: {
            201: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                }
            },
            400: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                }
            }
        }
    },
    validateUsername: {
        querystring: {
            type: 'object',
            required: ['username'],
            properties: {
                username: { type: 'string' }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    valid: { type: 'boolean' },
                    message: { type: 'string' },
                    id: { type: 'number' },
                    avatar: { type: 'string' },
                    wins: { type: 'number' },
                    losses: { type: 'number' }
                }
            },
            400: {
                type: 'object',
                properties: {
                    valid: { type: 'boolean' },
                    message: { type: 'string' }
                }
            }
        }
    }
};

module.exports = tournamentSchema;
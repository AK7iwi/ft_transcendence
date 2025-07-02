const tournamentSchema = {
    gameResult: {
        body: {
            type: 'object',
            required: ['winnerId', 'loserId'],
            properties: {
                winnerId: { type: 'number' },
                loserId: { type: 'number' }
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
        }
    },
    validateUsername: {
        body: {
            type: 'object',
            required: ['username'],
            properties: {
                username: { type: 'string' }
            }
        }
    }
};

module.exports = tournamentSchema;
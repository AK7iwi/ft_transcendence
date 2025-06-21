const userSchema = {
    getUserById: {
        params: {
            type: 'object',
            properties: {
                id: { type: 'integer', minimum: 1 }
            },
            required: ['id']
        },
    },
    getMatchHistoryById: {
        params: {
            type: 'object',
            properties: {
                id: { type: 'integer', minimum: 1 }
            },
            required: ['id']
        },
    },
    getUserStats: {
        params: {
            type: 'object',
            properties: {
                id: { type: 'integer', minimum: 1 }
            },
            required: ['id']
        },
    }
};

module.exports = userSchema;

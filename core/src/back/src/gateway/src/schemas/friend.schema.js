const friendSchema = {
    addFriend: {
        body: {
            type: 'object',
            required: ['username'],
            properties: {
                username: { 
                    type: 'string',
                    minLength: 3,
                    maxLength: 20
                }
            }
        },
        response: {
            200: {
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
            },
            404: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                }
            },
            500: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                }
            }
        }
    }
};

module.exports = friendSchema;
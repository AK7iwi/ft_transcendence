const chatSchema = {
    sendMessage: {
        body: {
            type: 'object',
            required: ['receiverId', 'content'],
            properties: {
                receiverId: {
                    type: 'integer',
                    minimum: 1
                },
                content: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 1000
                }
            },
            additionalProperties: false
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
            500: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                }
            }
        }
    },
    getMessages: {
        params: {
            type: 'object',
            properties: {
                userId: { type: 'integer', minimum: 1 }
            },
            required: ['userId']
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'integer' },
                                sender_id: { type: 'integer' },
                                receiver_id: { type: 'integer' },
                                content: { type: 'string' },
                                timestamp: { type: 'string' },
                                sender_username: { type: 'string' }
                            }
                        }
                    }
                }
            },
            400: {
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

module.exports = chatSchema;
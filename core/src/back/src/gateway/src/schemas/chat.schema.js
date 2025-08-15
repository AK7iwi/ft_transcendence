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
                    message: { type: 'string' },
                    data: {
                        type: 'object',
                        properties: {
                            user: {
                                type: 'object',
                                properties: {
                                    username: { type: 'string' },
                                    message: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            },
            400: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    statusCode: { type: 'number' },
                    errorCode: { type: 'string' },
                    message: { type: 'string' },
                    timestamp: { type: 'string' },
                    details: {},
                    path: { type: 'string' }
                }
            },
            500: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    statusCode: { type: 'number' },
                    errorCode: { type: 'string' },
                    message: { type: 'string' },
                    timestamp: { type: 'string' },
                    details: {},
                    path: { type: 'string' }
                }
            }
        }
    },
    getMessages: {
        params: {
            type: 'object',
            required: ['userId'],
            properties: {
                userId: {
                    type: 'string', 
                    minimum: 1
                }
            },
            additionalProperties: false
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
                                sender_username: { type: 'string' },
                                receiver_username: { type: 'string' },
                                content: { type: 'string' },
                                timestamp: { type: 'string' }
                            }
                        }
                    }
                }
            },
            400: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    statusCode: { type: 'number' },
                    errorCode: { type: 'string' },
                    message: { type: 'string' },
                    timestamp: { type: 'string' },
                    details: {},
                    path: { type: 'string' }
                }
            },
            500: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    statusCode: { type: 'number' },
                    errorCode: { type: 'string' },
                    message: { type: 'string' },
                    timestamp: { type: 'string' },
                    details: {},
                    path: { type: 'string' }
                }
            }
        }
    }
};

module.exports = chatSchema;
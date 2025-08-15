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
        }
    },
    getMessages: {
        params: {
            type: 'object',
            required: ['userId'],
            properties: {   
                userId: {
                    type: 'integer',
                    minimum: 1
                }
            },
            additionalProperties: false
        }
    }
};

module.exports = chatSchema;
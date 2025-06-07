const internalSchema = {
    createUser: {
        body: {
            required: ['userId', 'username'],
            type: 'object',
            properties: {
                userId: { type: 'number' },
                username: { 
                    type: 'string', 
                    minLength: 3, 
                    maxLength: 20, 
                    pattern: '^[a-zA-Z0-9_-]+$' 
                }
            },
            additionalProperties: false
        }
   }
}

module.exports = internalSchema;
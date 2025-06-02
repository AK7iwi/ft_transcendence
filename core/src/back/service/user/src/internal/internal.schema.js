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
    }
}

module.exports = internalSchema;
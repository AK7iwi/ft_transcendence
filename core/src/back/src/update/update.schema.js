const updateSchema = {
    update: {
        body: {
            type: 'object',
            required: ['username', 'newUsername'],
            properties: {
                username: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 30,
                    pattern: '^[a-zA-Z0-9_-]+$'
                },
                newUsername: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 30,
                    pattern: '^[a-zA-Z0-9_-]+$'
                }
            }
        }
    },
    updatePassword: {
        body: {
            type: 'object',
            required: ['username', 'newPassword'],
            properties: {
                username: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 30,
                    pattern: '^[a-zA-Z0-9_-]+$'
                },
                newPassword: {
                    type: 'string',
                    minLength: 8,
                    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'
                }
            }
        }
    }
};

module.exports = updateSchema;

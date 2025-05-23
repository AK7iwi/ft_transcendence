const authSchema = {
    register: {
        body: {
            type: 'object',
            required: ['username', 'email', 'password'],
            properties: {
                username: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 30,
                    pattern: '^[a-zA-Z0-9_-]+$'
                },
                email: {
                    type: 'string',
                    format: 'email'
                },
                password: {
                    type: 'string',
                    minLength: 8,
                    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'
                }
            }
        }
    },
    login: {
        body: {
            type: 'object',
            required: ['username', 'password'],
            properties: {
                username: {
                    type: 'string',
                    minLength: 3
                },
                password: {
                    type: 'string',
                    minLength: 8
                }
            }
        }
    }
};

module.exports = authSchema; 
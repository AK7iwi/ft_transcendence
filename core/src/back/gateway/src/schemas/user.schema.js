const userSchema = {
    updateUsername: {
        body: {
            type: 'object',
            required: ['currentUsername', 'newUsername'],
            properties: {
                currentUsername: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 20,
                    pattern: '^[a-zA-Z0-9_-]+$'
                },
                newUsername: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 20,
                    pattern: '^[a-zA-Z0-9_-]+$'
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
                                    id: { type: 'number' },
                                    username: { type: 'string' }
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
                    message: { type: 'string' }
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
                    maxLength: 20,
                    pattern: '^[a-zA-Z0-9_-]+$'
                },
                newPassword: {
                    type: 'string',
                    minLength: 8,
                    maxLength: 100,
                    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?])[A-Za-z\\d!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?]{8,}$'
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
                                    id: { type: 'number' },
                                    username: { type: 'string' }
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
                    message: { type: 'string' }
                }
            }
        }
    },
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
                                    id: { type: 'number' },
                                    username: { type: 'string' }
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
                    message: { type: 'string' }
                }
            }
        }
    }
};

module.exports = userSchema;
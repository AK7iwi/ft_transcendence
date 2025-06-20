const userSchema = {
    getMe: {
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
                                    username: { type: 'string' },
                                    avatar: { type: 'string' },
                                    twoFactorEnabled: { type: 'boolean' },
                                    wins: { type: 'number' },
                                    losses: { type: 'number' }
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
            },
            404: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                }
            }
        }
    },
    updateUsername: {
        body: {
            type: 'object',
            required: ['newUsername'],
            properties: {
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
            required: ['newPassword'],
            properties: {
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
    getMatchHistory: {
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
                                matchId: { type: 'number' },
                                user_id: { type: 'number' },
                                opponent: { type: 'string' },
                                result: { type: 'string', enum: ['win', 'loss'] },
                                scoreUser: { type: 'number' },
                                scoreOpponent: { type: 'number' },
                                playedAt: { type: 'string' }
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
    getMatchHistoryById: {
        params: {
            type: 'object',
            properties: {
                id: { type: 'integer', minimum: 1 }
            },
            required: ['id']
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
                                match_id: { type: 'integer' },
                                user_id: { type: 'integer' },
                                opponent: { type: 'string' },
                                result: { type: 'string', enum: ['win', 'loss'] },
                                score_user: { type: 'integer' },
                                score_opponent: { type: 'integer' },
                                played_at: { type: 'string', format: 'date-time' }
                            }
                        }
                    }
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

module.exports = userSchema;
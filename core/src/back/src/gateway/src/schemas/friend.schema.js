const friendSchema = {
    addFriend: {
        body: {
            type: 'object',
            required: ['friendUsername'],
            properties: {
                friendUsername: {
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
                            },
                            friend: {
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
                    statusCode: { type: 'number' },
                    errorCode: { type: 'string' },
                    message: { type: 'string' },
                    timestamp: { type: 'string' },
                    details: {},
                    path: { type: 'string' }
                }
            },
            404: {
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
            409: {
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
    getFriends: {
        body: {
            type: 'object',
            required: [],
            properties: {},
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
                            },
                            friends: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        username: { type: 'string' },
                                        avatar: { type: 'string' }
                                    }
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
    getBlocked: {
        body: {
            type: 'object',
            required: [],
            properties: {},
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
                            },
                            blockedFriends: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        username: { type: 'string' }
                                    }
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
    blockUser: {
        body: {
            type: 'object',
            required: ['blockedId'],
            properties: {
                blockedId: {
                    type: 'number'
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
                            },
                            blockedFriend: {
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
    unblockUser: {
        body: {
            type: 'object',
            required: ['unblockId'],
            properties: {
                unblockId: {
                    type: 'number'
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
                            },
                            unblockedFriend: {
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
                    statusCode: { type: 'number' },
                    errorCode: { type: 'string' },
                    message: { type: 'string' },
                    timestamp: { type: 'string' },
                    details: {},
                    path: { type: 'string' }
                }
            },
            404: {
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
    removeFriend: {
        body: {
            type: 'object',
            required: ['friendId'],
            properties: {
                friendId: {
                    type: 'number'
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
                            },
                            removedFriend: {
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

module.exports = friendSchema;
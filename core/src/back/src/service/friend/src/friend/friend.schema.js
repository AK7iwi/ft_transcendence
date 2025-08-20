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
        }
    },
    getFriends: {
        body: {
            type: 'object',
            required: [],
            properties: {},
            additionalProperties: false
        }
    },
    getBlocked: {
        body: {
            type: 'object',
            required: [],
            properties: {},
            additionalProperties: false
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
        }
    },
    unblockUser: {
        body: {
            type: 'object',
            required: ['blockedId'],
            properties: {
                blockedId: {
                    type: 'number'
                }
            },
            additionalProperties: false
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
        }
    }
};

module.exports = friendSchema;
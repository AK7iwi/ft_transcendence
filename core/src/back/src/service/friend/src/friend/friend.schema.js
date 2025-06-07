const friendSchema = {
    addFriend: {
        body: {
            type: 'object',
            required: ['username'],
            properties: {
                username: { type: 'string' }
            }
        }
    }
};

module.exports = friendSchema;

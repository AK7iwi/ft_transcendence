const friendSchema = {
    addFriend: {
        body: {
            type: 'object',
            required: ['username'],
            properties: {
                username: {
                    type: 'string',
                    minLength: 3,
                    maxLength: 20,
                    pattern: '^[a-zA-Z0-9_-]+$'
                }
            }
        }   
    }
};

module.exports = friendSchema;

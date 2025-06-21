const avatarSchema = {
    uploadAvatar: {
        consumes: ['multipart/form-data'],
        body: {
            type: 'object',
            properties: {
                avatar: { type: 'string', format: 'binary' }
            },
            required: ['avatar']
        }
    }
};

module.exports = avatarSchema;

const AvatarService = require('./avatar.service');

class AvatarController {
    async uploadAvatar(request, reply) {
        try {
            const file = await request.file();
            const userId = request.user.id;

            const result = await AvatarService.uploadAvatar(file, userId);

            return reply.code(200).send({
                success: true,
                message: 'Avatar uploaded successfully',
                data: {
                    avatarUrl: result.avatarUrl
                }
            });
        } catch (err) {
            request.log.error('[AVATAR] Upload error:', err);
            return reply.code(400).send({ 
                success: false, 
                message: err.message || 'Server error during avatar upload' 
            });
        }
    }
}

module.exports = new AvatarController();

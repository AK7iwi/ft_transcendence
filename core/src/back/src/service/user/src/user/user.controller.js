const UserService = require('./user.service');

class UserController {
    async getMe(request, reply) {
        try {
            const userId = request.user.id;

            const user = await UserService.getUser(userId);

            return reply.code(200).send({
                success: true,
                message: 'User information retrieved successfully',
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        avatar: user.avatar || '/avatars/default.png',
                        twoFactorEnabled: user.twoFactorEnabled,
                        wins: user.wins,
                        losses: user.losses
                    }
                }
            });
        } catch (error) {
            return reply.code(400).send({
                success: false,
                message: error.message || 'Failed to get user information'
            });
        }
    }
}

module.exports = new UserController();
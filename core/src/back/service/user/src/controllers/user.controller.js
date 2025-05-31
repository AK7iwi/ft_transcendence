const UserService = require('../services/user.service');

class UserController {
    async getMe(request, reply) {
        try {
            const id = request.user.id;
            const user = await UserService.getUser(id);

            return reply.code(200).send({
                success: true,
                message: 'User information retrieved successfully',
                data: {
                    user: {
                        id: user.user_id,
                        username: user.username,
                        avatar: user.avatar || '/avatars/default.png',
                        twoFactorEnabled: !!user.two_factor_enabled,
                        wins: user.wins,
                        losses: user.losses
                    }
                }
            });

        } catch (error) {
            return reply.code(500).send({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new UserController();
const UserService = require('./user.service');

class UserController {
    async getMe(request, reply) {
        try {
            const userId = request.user.id;
            const user = await UserService.getUser(userId);

            if (!user) {
                return reply.code(404).send({
                    success: false,
                    message: 'User not found'
                });
            }
            
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

    async getUserById(request, reply) {
        try {
            const userId = Number(request.params.id);
            const user = await UserService.getUser(userId);

            if (!user) {
                return reply.code(404).send({
                    success: false,
                    message: 'User not found'
                });
            }

            return reply.code(200).send({
                success: true,
                message: 'User retrieved successfully',
                data: {
                    id: user.id,
                    username: user.username,
                    avatar: user.avatar || 'default.png'
                }
            });
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({
                success: false,
                message: error.message || 'Failed to retrieve user'
            });
        }
    }

    async getMatchHistory(request, reply) {
        try {
            const userId = request.user.id;
            const matchHistory = await UserService.getMatchHistory(userId);

            return reply.code(200).send({
                success: true,
                message: 'Match history retrieved successfully',
                data: matchHistory
            });
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({
                success: false,
                message: error.message || 'Failed to load match history'
            });
        }
    }

    async getMatchHistoryById(request, reply) {
        try {
            const friendId = Number(request.params.id);
            const matchHistory = await UserService.getMatchHistory(friendId);

            return reply.code(200).send({
                success: true,
                message: 'Match history retrieved successfully',
                data: matchHistory
            });
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({
                success: false,
                message: error.message || 'Failed to load match history for user'
            });
        }
    }

    async getUserStats(request, reply) {
        try {
            const userId = Number(request.params.id);
            const stats = await UserService.getUserStats(userId);

            if (!stats) {
                return reply.code(404).send({
                    success: false,
                    message: 'User not found'
                });
            }

            return reply.code(200).send({
                success: true,
                message: 'User stats retrieved successfully',
                data: {
                    wins: stats.wins,
                    losses: stats.losses
                }
            });
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({
                success: false,
                message: error.message || 'Failed to retrieve user stats'
            });
        }
    }
}

module.exports = new UserController();
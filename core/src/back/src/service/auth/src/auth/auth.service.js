const PasswordService = require('../security/password/password.service');
const DbAuth = require('../database/db.auth');
const { AuthenticationError, ConflictError } = require('../utils/error/errors');

class AuthService {
    static async checkIfUserExists(username) {
        const user = await DbAuth.getUserByUsername(username);
        if (user) {
            throw new ConflictError('Username already exists', {
                field: 'username',
                value: username
            });
        }
    }

    static async createUser(username, password) {
        const hashedPassword = await PasswordService.hashPassword(password);
        const user = await DbAuth.createUser(username, hashedPassword);
        
        return { 
            id: user.lastInsertRowid,
            username: username,
            hashedPassword: hashedPassword
        };
    }

    static async createUserInOtherServices(userId, username, hashedPassword, serviceClient) {
        await serviceClient.post(`${process.env.USER_SERVICE_URL}/internal/createUser`, {
            userId: userId,
            username: username,
            hashedPassword: hashedPassword
        });

        await serviceClient.post(`${process.env.FRIEND_SERVICE_URL}/internal/createUser`, {
            userId: userId,
            username: username
        });

        await serviceClient.post(`${process.env.CHAT_SERVICE_URL}/internal/createUser`, {
            userId: userId,
            username: username
        });

        await serviceClient.post(`${process.env.TOURNAMENT_SERVICE_URL}/internal/createUser`, {
            userId: userId,
            username: username
        });
    }

    static async loginUser(username, password) {
        // Check if user exists
        const user = await DbAuth.getUserByUsername(username);
        if (!user) {
            throw new AuthenticationError('Username or password is incorrect');
        }

        // Check if password is valid
        const isValid = await PasswordService.verifyPassword(password, user.password);
        if (!isValid) {
            throw new AuthenticationError('Username or password is incorrect');
        }

        return {
            id: user.id,
            username: user.username,
            twoFactorEnabled: user.two_factor_enabled
        };
    }
}

module.exports = AuthService;
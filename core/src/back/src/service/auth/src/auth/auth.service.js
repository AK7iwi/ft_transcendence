const PasswordService = require('../security/password/password.service');
const DbAuth = require('../database/db.auth');
const { AuthenticationError, ConflictError} = require('../utils/error/errors');

class AuthService {

    static async registerUser(username, password, serviceClient) {
        const existingUser = await DbAuth.getUserByUsername(username);
        if (existingUser) {
            throw new ConflictError('Username already exists', {
                field: 'username',
                value: username
            });
        }
        
        //protect
        // Hash password and create user
        const hashedPassword = await PasswordService.hashPassword(password);
        const result = await DbAuth.createUser(username, hashedPassword);
        
        // Create user in other services
        await serviceClient.post(`${process.env.USER_SERVICE_URL}/internal/createUser`, {
            userId: result.lastInsertRowid,
            username: username,
            hashedPassword: hashedPassword
        });

        await serviceClient.post(`${process.env.FRIEND_SERVICE_URL}/internal/createUser`, {
            userId: result.lastInsertRowid,
            username: username
        });

        await serviceClient.post(`${process.env.CHAT_SERVICE_URL}/internal/createUser`, {
            userId: result.lastInsertRowid,
            username: username
        });

        await serviceClient.post(`${process.env.TOURNAMENT_SERVICE_URL}/internal/createUser`, {
            userId: result.lastInsertRowid,
            username: username
        });
        
        return {
            id: result.lastInsertRowid,
            username: username
        };
    }

    static async loginUser(username, password) {
        const user = await DbAuth.getUserByUsername(username);
        if (!user) {
            throw new AuthenticationError('Invalid credentials', {
                field: 'username',
                reason: 'user_not_found'
            });
        }

        const isValid = await PasswordService.verifyPassword(password, user.password);
        if (!isValid) {
            throw new AuthenticationError('Invalid credentials', {
                field: 'password',
                reason: 'invalid_password'
            });
        }

        return {
            id: user.id,
            username: user.username,
            twoFactorEnabled: user.two_factor_enabled
        };
    }
}

module.exports = AuthService;
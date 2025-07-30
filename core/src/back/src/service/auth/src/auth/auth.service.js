const PasswordService = require('../security/password/password.service');
const DbAuth = require('../database/db.auth');
const { AuthenticationError, ConflictError } = require('../utils/error/errors');

class AuthService {
    static async registerUser(username, password, serviceClient) {
        //Check if user already exists
        const existingUser = await DbAuth.getUserByUsername(username);
        if (existingUser) {
            throw new ConflictError('Username already exists', {
                field: 'username',
                value: username
            });
        } 

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
            username: username
        };
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
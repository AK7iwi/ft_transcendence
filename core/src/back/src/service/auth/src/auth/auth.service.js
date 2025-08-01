const PasswordService = require('../security/password/password.service');
const DbAuth = require('../database/db.auth');
const { AuthenticationError, ConflictError } = require('../utils/error/errors');

class AuthService {
    static async checkIfUserExists(username, shouldExist) {
        const user = await DbAuth.getUserByUsername(username);
        if (shouldExist && !user) {
            throw new AuthenticationError('Username or password is incorrect');
        }
        else if (!shouldExist && user) {
            throw new ConflictError('Username already exists', {
                field: 'username',
                value: username
            });
        }
        
        return user;
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

    //if this fail, need to delete the user from others database
    static async createUserInOtherServices(user, serviceClient) {
        await serviceClient.post(`${process.env.USER_SERVICE_URL}/internal/createUser`, {
            userId: user.id,
            username: user.username,
            hashedPassword: user.hashedPassword
        });

        await serviceClient.post(`${process.env.FRIEND_SERVICE_URL}/internal/createUser`, {
            userId: user.id,
            username: user.username
        });

        await serviceClient.post(`${process.env.CHAT_SERVICE_URL}/internal/createUser`, {
            userId: user.id,
            username: user.username
        });

        await serviceClient.post(`${process.env.TOURNAMENT_SERVICE_URL}/internal/createUser`, {
            userId: user.id,
            username: user.username
        });
    }

    static async checkPassword(password, userPassword) {
        const isValid = await PasswordService.verifyPassword(password, userPassword);
        if (!isValid) {
            throw new AuthenticationError('Username or password is incorrect');
        }
    }
}

module.exports = AuthService;
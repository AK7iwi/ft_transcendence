const PasswordService = require('../security/password/password.service');
const DbAuth = require('../database/db.auth');
const { AuthenticationError, ConflictError, DatabaseError, ServiceError } = require('../utils/error/errors');

class AuthService {
    static async registerUser(username, password, serviceClient) {
        try {
            const existingUser = await DbAuth.getUserByUsername(username);
            if (existingUser) {
                throw new ConflictError('Username already exists', {
                    field: 'username',
                    value: username
                });
            }
            
            const hashedPassword = await PasswordService.hashPassword(password);
            const result = await DbAuth.createUser(username, hashedPassword);
            
            // Create user in other services
            try {
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
            } catch (serviceError) {
                throw new ServiceError('Failed to create user in all services', {
                    originalError: serviceError.message,
                    userId: result.lastInsertRowid
                });
            }
            
            return {
                id: result.lastInsertRowid,
                username: username
            };
        } catch (error) {
            if (error instanceof ConflictError || error instanceof ServiceError) {
                throw error;
            }

            if (error.code && error.code.startsWith('SQLITE_')) {
                throw new DatabaseError('Database operation failed', {
                    databaseCode: error.code,
                    operation: 'createUser'
                });
            }

            throw new ServiceError('Registration failed', {
                originalError: error.message
            });
        }
    }

    static async loginUser(username, password) {
        try {
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
        } catch (error) {
            if (error instanceof AuthenticationError) {
                throw error;
            }

            if (error.code && error.code.startsWith('SQLITE_')) {
                throw new DatabaseError('Database operation failed', {
                    databaseCode: error.code,
                    operation: 'getUserByUsername'
                });
            }

            throw new ServiceError('Login failed', {
                originalError: error.message
            });
        }
    }
}

module.exports = AuthService;

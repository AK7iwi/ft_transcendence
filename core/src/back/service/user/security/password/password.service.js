const bcrypt = require('bcrypt');

class PasswordService {
    // Static async method for password hashing
    static async hashPassword(password) {
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    }

    // Static async method for password verification
    static async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }
}

module.exports = PasswordService;
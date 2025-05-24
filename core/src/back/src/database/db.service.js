class DbService {
    // Hash password with bcrypt
    static async hashPassword(password) {
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    }

    // Verify password against hash
    static async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }
}

module.exports = DbService;
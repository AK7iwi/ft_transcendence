// Custom error classes for precise error handling
class AppError extends Error {
    constructor(message, statusCode, errorCode, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;
        
        // Maintains proper stack trace for where our error was thrown
        Error.captureStackTrace(this, this.constructor);
    }
}

// Specific error types
class AuthenticationError extends AppError {
    constructor(message, details = null) {
        super(message, 401, 'AUTHENTICATION_ERROR', details);
    }
}

class AuthorizationError extends AppError {
    constructor(message, details = null) {
        super(message, 403, 'AUTHORIZATION_ERROR', details);
    }
}

class NotFoundError extends AppError {
    constructor(message, details = null) {
        super(message, 404, 'NOT_FOUND_ERROR', details);
    }
}

class ConflictError extends AppError {
    constructor(message, details = null) {
        super(message, 409, 'CONFLICT_ERROR', details);
    }
}

class ServiceError extends AppError {
    constructor(message, details = null) {
        super(message, 500, 'SERVICE_ERROR', details);
    }
}

module.exports = {
    AppError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    ServiceError
}; 
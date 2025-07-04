const { AppError } = require('./errors');

class ErrorHandler {
    static handle(error, request, reply) {
        // Log the error
        request.log.error({
            error: error.message,
            stack: error.stack,
            url: request.url,
            method: request.method,
            user: request.user?.id || 'anonymous'
        });

        // If it's our custom error, use its properties
        if (error instanceof AppError) {
            return reply.code(error.statusCode).send({
                success: false,
                message: error.message,
                errorCode: error.errorCode,
                timestamp: error.timestamp,
                details: error.details,
                path: request.url
            });
        }

        // Handle database errors
        if (error.code && error.code.startsWith('SQLITE_')) {
            return this.handleDatabaseError(error, request, reply);
        }

        // Handle validation errors
        if (error.validation) {
            return this.handleValidationError(error, request, reply);
        }

        // Default error response
        return reply.code(500).send({
            success: false,
            message: 'Internal server error',
            errorCode: 'INTERNAL_ERROR',
            timestamp: new Date().toISOString(),
            path: request.url
        });
    }

    static handleDatabaseError(error, request, reply) {
        const errorMap = {
            'SQLITE_CONSTRAINT_UNIQUE': {
                statusCode: 409,
                errorCode: 'DUPLICATE_ENTRY',
                message: 'Resource already exists'
            },
            'SQLITE_CONSTRAINT_FOREIGNKEY': {
                statusCode: 400,
                errorCode: 'FOREIGN_KEY_VIOLATION',
                message: 'Referenced resource does not exist'
            },
            'SQLITE_CONSTRAINT_NOTNULL': {
                statusCode: 400,
                errorCode: 'NULL_CONSTRAINT_VIOLATION',
                message: 'Required field is missing'
            }
        };

        const errorInfo = errorMap[error.code] || {
            statusCode: 500,
            errorCode: 'DATABASE_ERROR',
            message: 'Database operation failed'
        };

        return reply.code(errorInfo.statusCode).send({
            success: false,
            message: errorInfo.message,
            errorCode: errorInfo.errorCode,
            timestamp: new Date().toISOString(),
            details: { databaseCode: error.code },
            path: request.url
        });
    }

    static handleValidationError(error, request, reply) {
        return reply.code(400).send({
            success: false,
            message: 'Validation failed',
            errorCode: 'VALIDATION_ERROR',
            timestamp: new Date().toISOString(),
            details: error.validation,
            path: request.url
        });
    }
}

module.exports = ErrorHandler; 
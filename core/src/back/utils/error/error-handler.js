const { AppError } = require('./errors');

class ErrorHandler {
    
    static handle(error, request, reply) {
        // Handle validation errors (from schemas)
        if (error.validation) {
            console.log('Handling validation error');
            const errorResponse = ErrorHandler.handleValidationError(error);
            console.log('VALIDATION RESPONSE:', errorResponse);
            const response = ErrorHandler.createFormattedErrorResponse(errorResponse, request.url);
            console.log('FINAL VALIDATION RESPONSE:', response);
            return reply.code(response.statusCode).send(response);
        }
    
        // If it's our custom error, use its properties
        if (error instanceof AppError) {
            console.log('GOING TO APPERROR BRANCH');
            const response = ErrorHandler.createFormattedErrorResponse(error, request.url);
            return reply.code(response.statusCode).send(response);
        }

        // Handle database errors
        if (error.code && error.code.startsWith('SQLITE_')) {
            console.log('GOING TO DATABASE BRANCH');
            const errorResponse = ErrorHandler.handleDatabaseError(error);
            const response = ErrorHandler.createFormattedErrorResponse(errorResponse, request.url);
            return reply.code(response.statusCode).send(response);
        }

        console.log('GOING TO DEFAULT BRANCH');
        // Default error response
        return reply.code(500).send({
            success: false,
            statusCode: 500,
            message: 'Internal server error',
            errorCode: 'INTERNAL_ERROR',
            timestamp: new Date().toISOString(),
            details: error.details,
            path: request.url
        });
    }

    static createFormattedErrorResponse(error, path) {
        return {
            success: false,
            statusCode: error.statusCode,
            errorCode: error.errorCode,
            message: error.message,
            timestamp: new Date().toISOString(),
            details: error.details || 'No details',
            path: path
        };
    }

    static handleValidationError(error) {

        const validationError = error.validation[0];
        const field = ErrorHandler.formatFieldName(validationError.instancePath);
        const message = ErrorHandler.getUserFriendlyMessage(validationError, field);
        const errorCode = ErrorHandler.getErrorCode(validationError);
        const value = validationError.data;

        const errorResponse = {
            statusCode: error.statusCode,
            message: message,
            errorCode: errorCode,
            details: {
                field: field,
                value: value
            }
        };
        
        return errorResponse;
    }

    // check step by step
    static formatFieldName(path) {
        let fieldName = path.replace(/^\//, '');
        fieldName = fieldName.replace(/[-_]([a-z])/g, (match, letter) => letter.toUpperCase());
        fieldName = fieldName.replace(/([A-Z])/g, ' $1').toLowerCase();
        fieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        
        return fieldName;
    }

    static getErrorCode(error) {
        const codeMap = {
            'required': 'FIELD_REQUIRED',
            'type': 'INVALID_TYPE',
            'minLength': 'TOO_SHORT',
            'maxLength': 'TOO_LONG',
            'pattern': 'INVALID_FORMAT',
            'enum': 'INVALID_VALUE',
            'minimum': 'VALUE_TOO_SMALL',
            'maximum': 'VALUE_TOO_LARGE',
            'minItems': 'TOO_FEW_ITEMS',
            'maxItems': 'TOO_MANY_ITEMS',
            'uniqueItems': 'DUPLICATE_ITEMS',
            'format': 'INVALID_FORMAT',
            'email': 'INVALID_EMAIL',
            'uri': 'INVALID_URI',
            'date': 'INVALID_DATE',
            'date-time': 'INVALID_DATETIME'
        };
        
        return codeMap[error.keyword] || 'VALIDATION_ERROR';
    }

    static getUserFriendlyMessage(error, field) {
        switch (error.keyword) {
            case 'required':
                return `${field} is required`;
            case 'type':
                const expectedType = error.params.type;
                const receivedType = typeof error.data;
                return `${field} must be a ${expectedType} (received ${receivedType})`;
            case 'minLength':
                return `${field} must be at least ${error.params.limit} characters long`;
            case 'maxLength':
                return `${field} must be no more than ${error.params.limit} characters long`;
            case 'pattern':
                return `${field} format is invalid`;
            case 'enum':
                const allowedValues = error.params.allowedValues || [];
                return `${field} must be one of: ${allowedValues.join(', ')}`;
            case 'minimum':
                return `${field} must be at least ${error.params.limit}`;
            case 'maximum':
                return `${field} must be no more than ${error.params.limit}`;
            case 'minItems':
                return `${field} must have at least ${error.params.limit} items`;
            case 'maxItems':
                return `${field} must have no more than ${error.params.limit} items`;
            case 'uniqueItems':
                return `${field} must not contain duplicate items`;
            case 'format':
                return `${field} format is invalid`;
            case 'email':
                return `${field} must be a valid email address`;
            case 'uri':
                return `${field} must be a valid URI`;
            case 'date':
                return `${field} must be a valid date`;
            case 'date-time':
                return `${field} must be a valid date and time`;
            default:
                return `${field} is invalid`;
        }
    }

    //to be formatted 
    static handleDatabaseError(error, request) {
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
            message: errorInfo.message,
            errorCode: errorInfo.errorCode,
            details: { databaseCode: error.code }
        });
    }
}

module.exports = ErrorHandler; 
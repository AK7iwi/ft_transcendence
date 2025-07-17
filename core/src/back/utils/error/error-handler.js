const { AppError } = require('./errors');

class ErrorHandler {
    
    static handle(error, request, reply) {
        console.log('=== ERROR HANDLER CALLED ===');
        console.log('Error:', error);
        console.log('Error type:', typeof error);
        console.log('Error constructor:', error.constructor.name);
        console.log('Error message:', error.message);
        console.log('Error code:', error.code);
        console.log('Error statusCode:', error.statusCode);
        console.log('Error errorCode:', error.errorCode);
        console.log('Error details:', error.details);
        console.log('Error instanceof AppError:', error instanceof AppError);
        console.log('AppError constructor:', AppError);
        console.log('Error stack:', error.stack);
        console.log('Request URL:', request.url);
        console.log('Request method:', request.method);
        console.log('Request user:', request.user?.id);
        console.log('==========================');

        // Handle validation errors
        if (error.validation) {
            console.log('Handling validation error');
            const errorResponse = ErrorHandler.handleValidationError(error, request);
            const response = ErrorHandler.createFormattedErrorResponse(errorResponse, request.url);
            return reply.code(errorResponse.statusCode).send(response);
        }
    
        // If it's our custom error, use its properties
        if (error instanceof AppError) {
            console.log('Handling AppError');
            const response = ErrorHandler.createFormattedErrorResponse(error, request.url);
            return reply.code(error.statusCode).send(response);
        }

        // Handle database errors
        if (error.code && error.code.startsWith('SQLITE_')) {
            console.log('Handling SQLite error:', error.code);
            const errorResponse = ErrorHandler.handleDatabaseError(error, request);
            const response = ErrorHandler.createFormattedErrorResponse(errorResponse, request.url);
            return reply.code(errorResponse.statusCode).send(response);
        }

        // Default error response
        console.log('Handling default error');
        return reply.code(500).send({
            success: false,
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
            message: error.message,
            errorCode: error.errorCode,
            timestamp: error.timestamp,
            details: error.details,
            path: path
        };
    }

    static handleValidationError(error, request) {
        const errors = validationErrors.map(error => {
            const field = ErrorHandler.formatFieldName(error.instancePath, error.params);
            const constraint = ErrorHandler.getConstraintType(error);
            
            const formattedError = {
                field: field,
                constraint: constraint,
                message: ErrorHandler.getUserFriendlyMessage(error, field),
                value: error.data,
                code: ErrorHandler.getErrorCode(error)
            };
            
            return formattedError; 
        });

        const result = {
            success: false,
            message: 'Validation failed',
            errorCode: 'VALIDATION_ERROR',
            timestamp: new Date().toISOString(),
            details: {
                errors: errors,
                totalErrors: errors.length
            }
        };
        
        return result;
    }

    static formatFieldName(instancePath, params) {
        let fieldName = instancePath.replace(/^\//, '') || params.missingProperty;
        fieldName = fieldName.replace(/[-_]([a-z])/g, (match, letter) => letter.toUpperCase());
        fieldName = fieldName.replace(/([A-Z])/g, ' $1').toLowerCase();
        fieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        return fieldName;
    }

    static getConstraintType(error) {
        const constraintMap = {
            'required': 'required',
            'type': 'type',
            'minLength': 'minLength',
            'maxLength': 'maxLength',
            'pattern': 'pattern',
            'enum': 'enum',
            'minimum': 'minimum',
            'maximum': 'maximum',
            'minItems': 'minItems',
            'maxItems': 'maxItems',
            'uniqueItems': 'uniqueItems',
            'format': 'format',
            'email': 'email',
            'uri': 'uri',
            'date': 'date',
            'date-time': 'dateTime',
            'custom': 'custom'
        };
        
        return constraintMap[error.keyword] || 'unknown';
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
            success: false,
            message: errorInfo.message,
            errorCode: errorInfo.errorCode,
            timestamp: new Date().toISOString(),
            details: { databaseCode: error.code },
            path: request.url
        });
    }
}

module.exports = ErrorHandler; 
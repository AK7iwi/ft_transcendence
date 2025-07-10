class ValidationErrorHandler {
    static handle(error, request, reply) {
        // Log the error
        request.log.error({
            error: error.message,
            stack: error.stack,
            url: request.url,
            method: request.method,
            user: request.user?.id || 'anonymous'
        });

        // Handle validation errors
        if (error.validation) {
            const formattedError = this.formatValidationError(error.validation);
            return reply.code(400).send(formattedError);
        }

        // Handle service client errors (from other services)
        if (error.statusCode && error.message) {
            return reply.status(error.statusCode).send({
                success: false,
                message: error.message,
                errorCode: error.errorCode || 'SERVICE_ERROR',
                timestamp: new Date().toISOString(),
                path: request.url
            });
        }

        // Handle other known errors
        if (error.statusCode) {
            return reply.status(error.statusCode).send({
                success: false,
                message: error.message || 'An error occurred',
                errorCode: 'HTTP_ERROR',
                timestamp: new Date().toISOString(),
                path: request.url
            });
        }

        // Handle unexpected errors
        return reply.status(500).send({
            success: false,
            message: 'Internal Server Error',
            errorCode: 'INTERNAL_ERROR',
            timestamp: new Date().toISOString(),
            path: request.url
        });
    }

    static formatValidationError(validationErrors) {
        const errors = validationErrors.map(error => {
            const field = this.formatFieldName(error.instancePath, error.params);
            const constraint = this.getConstraintType(error);
            
            return {
                field: field,
                constraint: constraint,
                message: this.getUserFriendlyMessage(error, field),
                value: error.data,
                code: this.getErrorCode(error)
            };
        });

        return {
            success: false,
            message: 'Validation failed',
            errorCode: 'VALIDATION_ERROR',
            timestamp: new Date().toISOString(),
            details: {
                errors: errors,
                totalErrors: errors.length
            }
        };
    }

    static formatFieldName(instancePath, params) {
        // Remove leading slash and convert to camelCase or use missingProperty
        let fieldName = instancePath.replace(/^\//, '') || params.missingProperty;
        
        // Convert snake_case or kebab-case to camelCase
        fieldName = fieldName.replace(/[-_]([a-z])/g, (match, letter) => letter.toUpperCase());
        
        // Convert to human-readable format
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

    static getUserFriendlyMessage(error, fieldName) {
        const field = fieldName || this.formatFieldName(error.instancePath, error.params);
        
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
}

module.exports = ValidationErrorHandler;

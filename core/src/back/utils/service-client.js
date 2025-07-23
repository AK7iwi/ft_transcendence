const fetch = require('node-fetch');

class ServiceClient {
    constructor(fastify) {
        this.fastify = fastify;
    }

    async request(serviceUrl, options) {
        try {
            const response = await fetch(serviceUrl, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            const data = await response.json();
            
            //test what is print 
            if (!response.ok) {
                const serviceUrlObj = new URL(serviceUrl);
                
                console.log('=== SERVICE CLIENT ERROR (!response.ok) ===');
                console.log('response.status:', response.status);
                console.log('data:', data);
                console.log('message:', data.message);
                console.log('errorCode:', data.errorCode);
                console.log('timestamp:', data.timestamp);
                console.log('details:', data.details);
                console.log('path:', serviceUrlObj.pathname);
                console.log('===================================');

                throw {
                    success: false,
                    statusCode: response.status,
                    message: data.message,
                    errorCode: data.errorCode,
                    timestamp: data.timestamp,
                    details: data.details,
                    path: serviceUrlObj.pathname,
                };
            }

            return { data, status: response.status };
        } catch (error) {
            if (error.success === false) {
                throw error;
            }
            
            const serviceUrlObj = new URL(serviceUrl);
            
            throw {
                success: false,
                message: error.message,
                errorCode: 'NETWORK_ERROR',
                timestamp: new Date().toISOString(),
                details: { url: serviceUrl },
                path: serviceUrlObj.pathname
            };
        }
    }

    async get(serviceUrl, options = {}) {
        return this.request(serviceUrl, {
            method: 'GET',
            ...options
        });
    }

    async post(serviceUrl, data, options = {}) {
        return this.request(serviceUrl, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options
        });
    }

    async put(serviceUrl, data, options = {}) {
        return this.request(serviceUrl, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options
        });
    }

    async delete(serviceUrl, data, options = {}) {
        return this.request(serviceUrl, {
            method: 'DELETE',
            body: JSON.stringify(data),
            ...options
        });
    }

    async patch(serviceUrl, data, options = {}) {
        return this.request(serviceUrl, {
            method: 'PATCH',
            body: JSON.stringify(data),
            ...options
        });
    }
}

module.exports = ServiceClient; 
const fp = require('fastify-plugin');
const axios = require('axios');

module.exports = fp(async function (fastify, opts) {
    // Create axios instance with default config
    const axiosInstance = axios.create({
        timeout: 5000, // 5 seconds timeout
        headers: {
            'Content-Type': 'application/json'
        }
    });

    // Add error interceptor
    axiosInstance.interceptors.response.use(
        response => response,
        error => {
            fastify.log.error('Axios error:', error.message);
            return Promise.reject(error);
        }
    );

    // Decorate fastify with axios instance
    fastify.decorate('axios', axiosInstance);
}); 
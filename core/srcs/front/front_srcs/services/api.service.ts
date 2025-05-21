export default class ApiService {
    private static readonly MAX_RETRIES = 3;
    private static readonly RETRY_DELAY_MS = 1000;
    private static readonly TIMEOUT_MS = 5000;
    private static readonly baseUrl = 'https://localhost:3000';

    private static getFetchOptions(options: RequestInit): RequestInit {
        return {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {}),
            },
        };
    }

    private static async fetchWithRetry(url: string, options: RequestInit, retries = this.MAX_RETRIES): Promise<Response> {
        try {
            return await fetch(url, this.getFetchOptions(options));
        } catch (error) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY_MS));
                return this.fetchWithRetry(url, options, retries - 1);
            }
            throw error;
        }
    }

static async updateUser(data: { username: string; newUsername?: string }) {
  const response = await this.fetchWithTimeout(`${this.baseUrl}/auth/update`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  const json = await this.safeParseJSON(response);

  if (!response.ok) {
    throw new Error(json?.error || 'Update failed');
  }

  return json.user; // ⬅️ retourne le nouvel utilisateur
}



    private static async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

        try {
            const response = await this.fetchWithRetry(url, { ...options, signal: controller.signal });
            return response;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    private static async safeParseJSON(response: Response): Promise<any> {
        const text = await response.text();
        if (!text) return {};
        try {
            return JSON.parse(text);
        } catch (err) {
            console.error('Failed to parse JSON:', text);
            throw new Error('Invalid JSON returned from server');
        }
    }

    static async register(username: string, email: string, password: string) {
        try {
            const response = await this.fetchWithTimeout(`${this.baseUrl}/auth/register`, {
                method: 'POST',
                body: JSON.stringify({ username, email, password })
            });

            const json = await this.safeParseJSON(response);

            if (!response.ok) {
                throw new Error(json?.error || 'Registration failed');
            }

            return json;
        } catch (error) {
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error('Request timed out. Please try again.');
                }
                throw error;
            }
            throw new Error('An unexpected error occurred');
        }
    }

    static async login(username: string, password: string) {
        try {
            const response = await this.fetchWithTimeout(`${this.baseUrl}/auth/login`, {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            const json = await this.safeParseJSON(response);

            if (!response.ok) {
                throw new Error(json?.error || 'Login failed');
            }

            return json;
        } catch (error) {
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error('Request timed out. Please try again.');
                }
                throw error;
            }
            throw new Error('An unexpected error occurred');
        }
    }
}


// export class ApiService {
//     private static baseUrl = '/api';  // This will be proxied to https://localhost:3000
//     private static readonly TIMEOUT_MS = 5000; // 5 seconds
//     private static readonly MAX_RETRIES = 3;
//     private static readonly RETRY_DELAY_MS = 1000; // 1 second

//     private static getHeaders() {
//         return {
//             'Content-Type': 'application/json',
//             'Accept': 'application/json',
//         };
//     }

//     private static getFetchOptions(options: RequestInit): RequestInit {
//         return {
//             ...options,
//             mode: 'cors',
//             credentials: 'include',
//             headers: {
//                 ...this.getHeaders(),
//                 ...options.headers,
//             },
//         };
//     }

//     private static async fetchWithRetry(url: string, options: RequestInit, retries = this.MAX_RETRIES): Promise<Response> {
//         try {
//             return await fetch(url, this.getFetchOptions(options));
//         } catch (error) {
//             if (retries > 0) {
//                 await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY_MS));
//                 return this.fetchWithRetry(url, options, retries - 1);
//             }
//             throw error;
//         }
//     }

//     private static async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
//         const controller = new AbortController();
//         const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

//         try {
//             const response = await this.fetchWithRetry(url, {
//                 ...options,
//                 signal: controller.signal
//             });
//             return response;
//         } finally {
//             clearTimeout(timeoutId);
//         }
//     }

//     static async register(username: string, email: string, password: string) {
//         try {
//             const response = await this.fetchWithTimeout(`${this.baseUrl}/auth/register`, {
//                 method: 'POST',
//                 body: JSON.stringify({ username, email, password })
//             });

//             if (!response.ok) {
//                 const error = await response.json();
//                 throw new Error(error.error || 'Registration failed');
//             }

//             return response.json();
//         } catch (error) {
//             if (error instanceof Error) {
//                 if (error.name === 'AbortError') {
//                     throw new Error('Request timed out. Please try again.');
//                 }
//                 throw error;
//             }
//             throw new Error('An unexpected error occurred');
//         }
//     }

//     static async login(username: string, password: string) {
//         try {
//             const response = await this.fetchWithTimeout(`${this.baseUrl}/auth/login`, {
//                 method: 'POST',
//                 body: JSON.stringify({ username, password })
//             });

//             if (!response.ok) {
//                 const error = await response.json();
//                 throw new Error(error.error || 'Login failed');
//             }

//             return response.json();
//         } catch (error) {
//             if (error instanceof Error) {
//                 if (error.name === 'AbortError') {
//                     throw new Error('Request timed out. Please try again.');
//                 }
//                 throw error;
//             }
//             throw new Error('An unexpected error occurred');
//         }
//     }
// }
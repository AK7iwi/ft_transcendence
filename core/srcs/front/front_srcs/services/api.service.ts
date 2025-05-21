export default class ApiService {
    private static readonly MAX_RETRIES = 3;
    private static readonly RETRY_DELAY_MS = 1000;
    private static readonly TIMEOUT_MS = 5000;
    private static readonly baseUrl = 'https://localhost:3000';

private static getFetchOptions(options: RequestInit): RequestInit {
  const token = localStorage.getItem('token');

  return {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  };
}

static async getProfile() {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  const response = await this.fetchWithTimeout(`${this.baseUrl}/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const json = await this.safeParseJSON(response);
  if (!response.ok) {
    throw new Error(json?.error || 'Failed to fetch profile');
  }

  return json;
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

static async updatePassword(username: string, newPassword: string) {
  const response = await this.fetchWithTimeout(`${this.baseUrl}/user/password`, {
    method: 'POST',
    body: JSON.stringify({ username, newPassword })
  });

  const json = await this.safeParseJSON(response);
  if (!response.ok) {
    throw new Error(json?.error || 'Failed to update password');
  }

  return json;
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

    // ✅ Store token + user
    localStorage.setItem('token', json.token);
    localStorage.setItem('user', JSON.stringify({ username: json.username, email: json.email }));

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

static logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
}
import { API_BASE_URL } from '../config';

export default class ApiService {
    private static readonly MAX_RETRIES = 3;
    private static readonly RETRY_DELAY_MS = 1000;
    private static readonly TIMEOUT_MS = 5000;
    private static readonly baseUrl = API_BASE_URL;
    
private static getFetchOptions(options: RequestInit): RequestInit {
  const token = localStorage.getItem('token');

  return {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
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

  return json.user; // retourne le nouvel utilisateur
}

static async updatePassword(username: string, newPassword: string) {
  const response = await this.fetchWithTimeout(`${this.baseUrl}/auth/password`, {
    method: 'PUT',
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

    // Store token + user
    localStorage.setItem('token', json.token);
    localStorage.setItem('user', JSON.stringify({
  username: json.user.username,
  email: json.user.email
}));


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

static async setup2FA() {
  const token = localStorage.getItem('token');
  const response = await this.fetchWithTimeout(`${this.baseUrl}/auth/2fa/setup`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({})
  });

  const json = await this.safeParseJSON(response);

  if (!response.ok) {
    throw new Error(json?.error || 'Failed to setup 2FA');
  }

  return json;
}




static async verify2FA(token2FA: string) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${this.baseUrl}/auth/2fa/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ token: token2FA })
  });
  if (!res.ok) throw new Error('Échec vérification 2FA');
  return res.json();
}




static logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

static async uploadAvatar(file: File): Promise<string> {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${this.baseUrl}/avatar/upload-avatar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error('Avatar upload failed');
  }

  const data = await response.json();
  return data.avatarUrl;
}



}
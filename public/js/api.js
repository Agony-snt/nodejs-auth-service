// API Module - Handles all HTTP requests with token refresh logic

const API_BASE = '/auth';
const USERS_BASE = '/users';
const VERIFY_BASE = '/verification';

class ApiClient {
    constructor() {
        this.isRefreshing = false;
        this.failedQueue = [];
    }

    // Process queued requests after token refresh
    processQueue(error, token = null) {
        this.failedQueue.forEach(prom => {
            if (error) {
                prom.reject(error);
            } else {
                prom.resolve(token);
            }
        });
        this.failedQueue = [];
    }

    // Make authenticated request with automatic token refresh
    async request(url, options = {}) {
        const config = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Remove Content-Type for FormData
        if (options.body instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            // If access token expired, try to refresh
            if (response.status === 401 && !options._retry) {

                if (this.isRefreshing) {
                    // Queue the request while refreshing
                    return new Promise((resolve, reject) => {
                        this.failedQueue.push({ resolve, reject });
                    }).then(token => {
                        config.headers['Authorization'] = `Bearer ${token}`;
                        return this.request(url, { ...options, ...config, _retry: true });
                    }).catch(err => Promise.reject(err));
                }

                this.isRefreshing = true;
                config._retry = true;

                try {
                    // Try to refresh token
                    const refreshResponse = await fetch(`${API_BASE}/refresh`, {
                        method: 'POST',
                        credentials: 'include'
                    });

                    if (refreshResponse.ok) {
                        // Token refreshed successfully
                        const token = 'refreshed'; // Token is set in cookie
                        this.processQueue(null, token);
                        this.isRefreshing = false;
                        return this.request(url, { ...options, _retry: true });
                    } else {
                        // Refresh failed - logout and redirect
                        this.processQueue(new Error('Session expired'), null);
                        this.isRefreshing = false;
                        window.location.href = '#login';
                        throw new Error('Session expired');
                    }
                } catch (refreshError) {
                    this.processQueue(refreshError, null);
                    this.isRefreshing = false;
                    throw refreshError;
                }
            }

            if (!response.ok) {
                throw { status: response.status, ...data };
            }

            return data;

        } catch (error) {
            if (error.status) throw error;
            throw { message: error.message || 'Network error', status: 0 };
        }
    }

    // Auth endpoints
    async login(identifier, password) {
        return this.request(`${API_BASE}/login`, {
            method: 'POST',
            body: JSON.stringify({ identifier, password })
        });
    }

    async register(data) {
        // Check if data is FormData
        if (data instanceof FormData) {
            return this.request(`${API_BASE}/register`, {
                method: 'POST',
                body: data
            });
        }
        // Send as JSON
        return this.request(`${API_BASE}/register`, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        });
    }

    async logout() {
        return this.request(`${API_BASE}/logout`, {
            method: 'POST'
        });
    }

    async getMe() {
        return this.request(`${API_BASE}/me`);
    }

    async checkAuth() {
        return this.request(`${API_BASE}/check`);
    }

    async refresh() {
        return this.request(`${API_BASE}/refresh`, {
            method: 'POST'
        });
    }

    // User endpoints
    async updateUser(data) {
        if (data instanceof FormData) {
            return this.request(`${USERS_BASE}/update`, {
                method: 'PATCH',
                body: data
            });
        }
        return this.request(`${USERS_BASE}/update`, {
            method: 'PATCH',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        });
    }

    async deleteAccount(password) {
        return this.request(`${USERS_BASE}/remove-account`, {
            method: 'DELETE',
            body: JSON.stringify({ password })
        });
    }

    async getAllUsers() {
        return this.request(`${USERS_BASE}/`);
    }

    async deleteUser(userId) {
        return this.request(`${USERS_BASE}/kick`, {
            method: 'DELETE',
            body: JSON.stringify({ userId })
        });
    }

    // Verification endpoints
    async getVerificationMethods() {
        return this.request(`${VERIFY_BASE}/methods`);
    }

    async sendVerificationCode(type, newValue = null) {
        return this.request(`${VERIFY_BASE}/send-code`, {
            method: 'POST',
            body: JSON.stringify({ type, newValue })
        });
    }

    async verifyAndUpdate(verificationId, code) {
        return this.request(`${VERIFY_BASE}/verify`, {
            method: 'POST',
            body: JSON.stringify({ verificationId, code })
        });
    }

    async changePassword(currentPassword, newPassword) {
        return this.request(`${VERIFY_BASE}/change-password`, {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    }

    async addEmail(email) {
        return this.request(`${VERIFY_BASE}/add-email`, {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }
}

// Export singleton instance
window.api = new ApiClient();

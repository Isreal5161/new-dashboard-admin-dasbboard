// Authentication Service

const AUTH_TOKEN_KEY = 'userToken';
const USER_DATA_KEY = 'userData';

class AuthService {
    constructor() {
        this.apiBaseUrl = 'https://real-estate-backend-d9es.onrender.com';
    }

    // Register new user
    async register(userData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Registration failed');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    // Login user
    async login(credentials) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }

            const data = await response.json();
            
            // Store the token and user data
            this.setToken(data.token);
            this.setUserData(data.user);

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Logout user
    logout() {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
        window.location.href = 'login.html';
    }

    // Get the authentication token
    getToken() {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    }

    // Set the authentication token
    setToken(token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
    }

    // Get the stored user data
    getUserData() {
        const userData = localStorage.getItem(USER_DATA_KEY);
        return userData ? JSON.parse(userData) : null;
    }

    // Set user data in localStorage
    setUserData(userData) {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getToken();
    }

    // Get the authenticated user's profile
    async getProfile() {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${this.apiBaseUrl}/api/users/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }

            const data = await response.json();
            this.setUserData(data);
            return data;
        } catch (error) {
            console.error('Error fetching profile:', error);
            throw error;
        }
    }

    // Update the authenticated user's profile
    async updateProfile(profileData) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${this.apiBaseUrl}/api/users/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const data = await response.json();
            this.setUserData(data);
            return data;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }
}

// Create a single instance of AuthService
const authService = new AuthService();
// Authentication Service

const AUTH_TOKEN_KEY = 'token';
const USER_DATA_KEY = 'userData';

class AuthService {
    constructor() {
        this.apiBaseUrl = 'https://real-estate-backend-d9es.onrender.com/api/auth';
        this.maxRetries = 3; // Maximum number of retry attempts
    }

    // Check if the server is available
    async checkServer() {
        try {
            console.log('Checking server health at:', this.apiBaseUrl.replace('/api/auth', '/api/health'));
            const response = await fetch(this.apiBaseUrl.replace('/api/auth', '/api/health'), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) {
                console.error('Server health check failed with status:', response.status);
                return false;
            }
            const data = await response.json();
            console.log('Server health check response:', data);
            return data.status === 'OK';
        } catch (error) {
            console.error('Server health check failed:', error);
            return false;
        }
    }

    // Helper method to handle API requests with retries
    async makeRequest(url, options, retryCount = 0) {
        try {
            const response = await fetch(url, options);
            
            // Try to parse the response as JSON regardless of status
            let data;
            try {
                data = await response.json();
            } catch (e) {
                console.error('Failed to parse response as JSON:', e);
            }
            
            // Check if response is ok (status in the range 200-299)
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(data?.message || 'Invalid email or password. Please check your credentials and try again.');
                }
                throw new Error(data?.message || `Server error: HTTP status ${response.status}`);
            }
            
            // Set the parsed data on the response object for later use
            response.parsedData = data;
            return response;
        } catch (error) {
            console.error(`Request failed (attempt ${retryCount + 1}):`, error);
            
            if (retryCount < this.maxRetries) {
                // Calculate exponential backoff delay (1s, 2s, 4s)
                const delay = Math.pow(2, retryCount) * 1000;
                console.log(`Retrying in ${delay/1000} seconds... (${retryCount + 1}/${this.maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.makeRequest(url, options, retryCount + 1);
            }
            
            // If we've exhausted all retries, throw a user-friendly error
            const errorMessage = error.message.includes('fetch') || error.name === 'TypeError'
                ? 'Network error: Please check your internet connection and try again.'
                : error.message;
            throw new Error(errorMessage);
        }
    }

    // Register new user
    async register(userData) {
        try {
            console.log('Registering user with data:', userData);
            const response = await fetch(`${this.apiBaseUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    fullName: userData.fullName,
                    email: userData.email,
                    password: userData.password
                })
            });
            
            // If registration is successful, mark this as a new user
            if (response.ok) {
                localStorage.setItem('isNewUser', 'true');
            }

            let data;
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    throw new Error('Server returned invalid response format');
                }
            } catch (parseError) {
                console.error('Error parsing response:', parseError);
                throw new Error('Unable to process server response. Please try again.');
            }
            
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Registration failed. Please try again.');
            }

            return data;
        } catch (error) {
            console.error('Registration error:', error);
            if (error.name === 'TypeError' || error.message.includes('fetch')) {
                throw new Error('Network error: Please check your connection and try again');
            }
            throw error;
        }
    }

    // Login user
    async login(credentials) {
        try {
            console.log('Checking server availability...');
            const isServerAvailable = await this.checkServer();
            if (!isServerAvailable) {
                throw new Error('Server is currently unavailable. Please try again later.');
            }

            console.log('Attempting login with:', { email: credentials.email });
            
            const response = await this.makeRequest(`${this.apiBaseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password
                }),
                credentials: 'include',
                mode: 'cors'
            });

            console.log('Response status:', response.status);
            console.log('Response data:', response.parsedData);

            const data = response.parsedData;

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Login failed');
            }

            // Store the token and user data
            this.setToken(data.token);
            this.setUserData(data.user);

            return data;
        } catch (error) {
            console.error('Login error:', error);
            if (error.name === 'TypeError' || error.message.includes('fetch')) {
                throw new Error('Network error: The server is not responding. Please try again later.');
            }
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

            const response = await fetch('https://real-estate-backend-d9es.onrender.com/profile', {
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
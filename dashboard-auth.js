// Authentication Guard
function checkAuth() {
    // Debug: log token value to help diagnose unexpected redirects
    try {
        const token = authService.getToken();
        console.debug('checkAuth token:', token);
        // Treat literal 'undefined' or 'null' strings as missing tokens
        if (!token || token === 'undefined' || token === 'null') {
            console.warn('No valid auth token found, redirecting to login');
            window.location.href = 'login.html';
            return false;
        }
    } catch (e) {
        console.error('Error reading auth token in checkAuth:', e);
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Update UI with user data
async function updateUserInterface() {
    try {
        // Debug: log token before fetching profile
        try { console.debug('updateUserInterface token:', authService.getToken()); } catch (e) { console.debug('Could not read token:', e); }
        const userData = await authService.getProfile();
        console.debug('updateUserInterface userData:', userData);
        
        // Update user name in the UI
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(element => {
            element.textContent = userData.fullName || userData.username;
        });

        // Update user avatar if available
        if (userData.avatar) {
            const userAvatarElements = document.querySelectorAll('.user-avatar');
            userAvatarElements.forEach(element => {
                element.src = userData.avatar;
            });
        }

        // Update other user-specific elements
        if (userData.email) {
            const userEmailElements = document.querySelectorAll('.user-email');
            userEmailElements.forEach(element => {
                element.textContent = userData.email;
            });
        }

        // Handle logout
        const logoutButtons = document.querySelectorAll('[data-page="logout"]');
        logoutButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                authService.logout();
            });
        });

    } catch (error) {
        console.error('Error updating user interface:', error);
        // If there's an authentication error, redirect to login
        if (error.message.includes('authentication')) {
            authService.logout();
        }
    }
}

// Initialize dashboard
async function initializeDashboard() {
    if (!checkAuth()) return;
    
    // Show loading overlay
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }

    try {
        await updateUserInterface();
        
        // Initialize other dashboard features...
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    } finally {
        // Hide loading overlay
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
}
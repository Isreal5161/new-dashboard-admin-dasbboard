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

        // If profile fetch returned null (e.g. token invalid / user not found), handle gracefully
        if (!userData) {
            console.warn('updateUserInterface: no userData returned from profile - emitting auth:unauthorized and aborting UI update');
            try { window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { url: `${authService.apiBase}/profile`, token: authService.getToken() } })); } catch (e) { console.warn('Could not dispatch auth:unauthorized', e); }
            return;
        }
        
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

// Global auth unauthorized handler to centralize logout behavior
window.addEventListener('auth:unauthorized', (e) => {
    console.warn('Global auth:unauthorized event received', e.detail);
    // Prevent multiple banners
    if (window.__authBannerShown) return;
    window.__authBannerShown = true;

    // Create a small non-blocking banner with action buttons so the user can stay on the page
    try {
        const banner = document.createElement('div');
        banner.id = 'auth-banner';
        banner.style.position = 'fixed';
        banner.style.top = '12px';
        banner.style.left = '50%';
        banner.style.transform = 'translateX(-50%)';
        banner.style.zIndex = '99999';
        banner.style.background = '#fff8f0';
        banner.style.color = '#5a2b00';
        banner.style.border = '1px solid #f0c5a0';
        banner.style.padding = '12px 16px';
        banner.style.borderRadius = '8px';
        banner.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
        banner.innerHTML = `
            <div style="display:flex;gap:12px;align-items:center;">
                <div style="flex:1">Your session has expired or is invalid. You can stay on this page, but some features may not work.</div>
                <div style="display:flex;gap:8px;">
                    <button id="auth-login-btn" style="background:#1f6feb;color:white;border:none;padding:8px 10px;border-radius:6px;cursor:pointer;">Login</button>
                    <button id="auth-dismiss-btn" style="background:transparent;border:1px solid #ccc;padding:6px 8px;border-radius:6px;cursor:pointer;">Dismiss</button>
                </div>
            </div>
        `;
        document.body.appendChild(banner);

        document.getElementById('auth-login-btn').addEventListener('click', () => {
            // Clear sensitive data and go to login
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            window.location.href = 'login.html';
        });

        document.getElementById('auth-dismiss-btn').addEventListener('click', () => {
            banner.remove();
        });
    } catch (err) {
        // Fallback: if DOM manipulation fails, perform a soft logout
        console.warn('Could not show auth banner, falling back to logout', err);
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        window.location.href = 'login.html';
    }
});
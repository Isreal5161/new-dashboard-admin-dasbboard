// Lightweight API client used by the frontend to centralize requests
(function (global) {
    const API_BASE = (global.APP_CONFIG && global.APP_CONFIG.API_BASE_URL) ? global.APP_CONFIG.API_BASE_URL.replace(/\/$/, '') : '';

    function getToken() {
        return localStorage.getItem('token');
    }

    async function request(path, options = {}) {
        const url = `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
        options.headers = Object.assign({}, options.headers || {}, {
            'Content-Type': options.body instanceof FormData ? undefined : 'application/json'
        });

        const token = getToken();
        if (token) options.headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(url, options);
        if (res.status === 401) {
            // central event for unauthorized
            try { window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { url, token } })); } catch (e) {}
            throw new Error('Unauthorized');
        }

        const text = await res.text();
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok) {
            let body = text;
            try { body = contentType.includes('application/json') ? JSON.parse(text) : text; } catch (e) {}
            const err = new Error('Request failed');
            err.status = res.status; err.body = body;
            throw err;
        }

        if (contentType.includes('application/json')) {
            return JSON.parse(text);
        }
        return text;
    }

    async function getProfile() {
        return await request('/api/profile', { method: 'GET' });
    }

    async function getDashboardStats() {
        return await request('/api/listings/dashboard/stats', { method: 'GET' });
    }

    // Export
    global.apiClient = {
        request,
        getProfile,
        getDashboardStats,
    };
})(window);

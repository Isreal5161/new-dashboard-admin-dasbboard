/*===============================================================
 * INITIALIZATION AND GLOBAL VARIABLES
 *===============================================================*/

// Global Configuration
window.APP_CONFIG = {
    API_BASE_URL: 'https://real-estate-backend-d9es.onrender.com'
};

// Configure Axios defaults
if (window.axios) {
    axios.defaults.baseURL = window.APP_CONFIG.API_BASE_URL;
    axios.defaults.headers.common['Content-Type'] = 'application/json';
    
    // Add token to requests if available
    const token = localStorage.getItem('token');
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
}

// DOM Elements
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');
const overlay = document.getElementById('overlay');
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const submenuToggles = document.querySelectorAll('.has-submenu');

// Handle navigation active states
function updateNavigation() {
    const currentPath = window.location.hash || '#dashboard';
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.classList.add('active');
            link.setAttribute('data-active', 'true');
        } else {
            link.classList.remove('active');
            link.removeAttribute('data-active');
        }
    });
}

// Initial navigation setup
updateNavigation();

// Initialize dashboard authentication
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
});

// Listen for hash changes
window.addEventListener('hashchange', updateNavigation);
const notificationBadges = document.querySelectorAll('.notification-badge');

// Global socket instance for notifications and real-time updates
const socketConnection = {
    socket: null,
    
    // Initialize socket connection
    setupConnection() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn('No auth token found for socket connection');
                return;
            }

            if (this.socket) {
                console.log('Socket connection already exists');
                return;
            }

            // Connect to your backend URL
            this.socket = io(window.APP_CONFIG.API_BASE_URL, {
                auth: {
                    token: token
                }
            });

            this.socket.on('connect', () => {
                console.log('Socket connected successfully');
            });

            this.socket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
            });
        } catch (error) {
            console.error('Error setting up socket connection:', error);
        }

        this.socket = io('wss://real-estate-backend-d9es.onrender.com', {
            auth: { token },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            secure: true,
            transports: ['websocket']
        });

        this.setupEventListeners();
    },

    // Set up socket event listeners
    setupEventListeners() {
        // Connection events
        this.socket.on('connect', () => {
            console.log('Connected to notification system');
            showNotification('Connected to notification system', 'success');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            if (error.message === 'Authentication error') {
                console.error('Socket authentication failed');
                showNotification('Authentication error: Please log in again', 'error');
            } else {
                showNotification('Connection error: Retrying...', 'error');
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected:', reason);
            showNotification('Disconnected from notification system', 'error');
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('Reconnected after', attemptNumber, 'attempts');
            showNotification('Reconnected to notification system', 'success');
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('Reconnection error:', error);
            showNotification('Failed to reconnect. Please refresh the page.', 'error');
        });

        // Message events
        this.socket.on('new_message', (message) => {
            if (window.handleNewMessage) {
                window.handleNewMessage(message);
            }
        });

        // Typing events
        this.socket.on('typing_start', (userId) => {
            if (window.handleTypingStart) {
                window.handleTypingStart(userId);
            }
        });

        this.socket.on('typing_end', (userId) => {
            if (window.handleTypingEnd) {
                window.handleTypingEnd(userId);
            }
        });

        // Online/Offline status
        this.socket.on('user_online', (userId) => {
            if (window.handleUserOnline) {
                window.handleUserOnline(userId);
            }
        });

        this.socket.on('user_offline', (userId) => {
            if (window.handleUserOffline) {
                window.handleUserOffline(userId);
            }
        });

        // Message status events
        this.socket.on('message_delivered', (messageId) => {
            if (window.handleMessageDelivered) {
                window.handleMessageDelivered(messageId);
            }
        });

        this.socket.on('message_read', (data) => {
            if (window.handleMessageRead) {
                window.handleMessageRead(data);
            }
        });
    },

    // Get socket instance
    getSocket() {
        return this.socket;
    },

    // Message methods
    sendMessage(receiverId, message) {
        if (!this.socket?.connected) return false;
        this.socket.emit('send_message', { receiverId, message });
        return true;
    },

    markMessageAsRead(conversationId, messageId) {
        if (!this.socket?.connected) return;
        this.socket.emit('message_read', { conversationId, messageId });
    },

    // Typing indicators
    sendTypingStart(receiverId) {
        if (!this.socket?.connected) return;
        this.socket.emit('typing_start', receiverId);
    },

    sendTypingEnd(receiverId) {
        if (!this.socket?.connected) return;
        this.socket.emit('typing_end', receiverId);
    }
};

    // Function to check socket connection status
    function checkSocketConnection() {
        if (!socketConnection.socket) {
            console.warn('Socket not initialized');
            return false;
        }
        return socketConnection.socket.connected;
    }
    
    // Set up socket event handlers for notifications
    function setupNotificationHandlers() {
        if (!socketConnection.socket) return;
        
        // Handle new booking notifications
        socketConnection.socket.on('newBooking', (booking) => {
        if (!this.socket?.connected) {
            console.warn('Socket not connected, attempting to reconnect...');
            this.socket?.connect();
            return;
        }

        showNotification({
            title: 'New Booking Request',
            message: `${booking.clientName} requested to view ${booking.propertyTitle} on ${new Date(booking.viewingDate).toLocaleDateString()}`,
            type: 'success'
    });

// Notification Functions
    });
}

// Notification Functions
function showNotification({ title, message, type = 'info' }) {
    const container = document.getElementById('notification-container');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    notification.innerHTML = `
        <h4>${title}</h4>
        <p>${message}</p>
        <button class="close-btn">×</button>
    `;

    // Add close button event
    const closeBtn = notification.querySelector('.close-btn');
    closeBtn.onclick = () => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    };

    container.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function playNotificationSound() {
    const audio = new Audio('/notification-sound.mp3');
    audio.play().catch(err => console.warn('Could not play notification sound:', err));
}

function updateNotificationBadge(increment = 1) {
    notificationBadges.forEach(badge => {
        const currentCount = parseInt(badge.textContent) || 0;
        badge.textContent = currentCount + increment;
        badge.style.display = currentCount + increment > 0 ? 'block' : 'none';
    });
}

/*===============================================================
 * NAVIGATION AND SIDEBAR FUNCTIONALITY
 *===============================================================*/

// Mobile Navigation
function toggleSidebar() {
    sidebar.classList.toggle('open');
    overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
    document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : 'auto';
}

function closeSidebarMenu() {
    sidebar.classList.remove('open');
    overlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Event Listeners for Mobile Navigation
if (menuToggle) {
    menuToggle.addEventListener('click', toggleSidebar);
}

if (closeSidebar) {
    closeSidebar.addEventListener('click', closeSidebarMenu);
}

if (overlay) {
    overlay.addEventListener('click', closeSidebarMenu);
}

// Submenu Toggle
submenuToggles.forEach(submenu => {
    const link = submenu.querySelector('.nav-link');
    link.addEventListener('click', (e) => {
        if (submenu.querySelector('.submenu')) {
            e.preventDefault();
            submenu.classList.toggle('open');
        }
    });
});

/*===============================================================
 * DASHBOARD FUNCTIONALITY
 *===============================================================*/

// Utility function to refresh all dashboard related data
async function refreshDashboard() {
    try {
        await loadDashboardStats();
        if (document.querySelector('#my-listings-page.active')) {
            await setupMyListingsPage();
        }
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
        showNotification('Failed to refresh dashboard data', 'error');
    }
}

async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/listings/dashboard/stats`);
        const data = await response.json();

        // Update statistics
        document.querySelector('.stat-card:nth-child(1) h3').textContent = data.activeListings || 0;
        document.querySelector('.stat-card:nth-child(2) h3').textContent = data.reservationCount || 0;
        document.querySelector('.stat-card:nth-child(3) h3').textContent = `${data.totalEarnings || 0} XAF`;

        // Set up dashboard navigation buttons
        setupDashboardNavigation();

        // Update Upcoming Reservations
        updateDashboardSections(data);
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showNotification('Failed to load dashboard statistics', 'error');
    }
}

// Helper function to update dashboard sections
function updateDashboardSections(data) {
    // Update Upcoming Reservations
    const reservationsSection = document.querySelector('.dashboard-sections .section:nth-child(1) .empty-state');
    if (reservationsSection) {
        if (data.recentReservations && data.recentReservations.length > 0) {
            reservationsSection.innerHTML = data.recentReservations.map(reservation => `
                <div class="reservation-item">
                    <div class="reservation-details">
                        <h4>${reservation.propertyName}</h4>
                        <p>${reservation.date}</p>
                    </div>
                    <span class="status ${reservation.status}">${reservation.status}</span>
                </div>
            `).join('');
        } else {
            reservationsSection.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-calendar-times"></i>
                    <p>No upcoming reservations</p>
                </div>
            `;
        }
    }

    // Update Recent Messages
    const messagesSection = document.querySelector('.dashboard-sections .section:nth-child(2) .empty-state');
    if (messagesSection) {
        if (data.recentMessages && data.recentMessages.length > 0) {
            messagesSection.innerHTML = data.recentMessages.map(message => `
                <div class="message-item">
                    <div class="message-details">
                        <h4>${message.sender}</h4>
                        <p>${message.preview}</p>
                    </div>
                    <span class="time">${message.time}</span>
                </div>
            `).join('');
        } else {
            messagesSection.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-inbox"></i>
                    <p>No new messages</p>
                </div>
            `;
        }
    }
}

// Setup dashboard navigation buttons
function setupDashboardNavigation() {
    // Add event listener for the "+ Add new" button
    const addNewButton = document.querySelector('.stat-card:nth-child(1) .stat-link');
    if (addNewButton) {
        addNewButton.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('add-listing');
            setupAddListingPage(); // Ensure the add listing page is properly initialized
        });
    }

    // Add event listener for the "Manage" button (Bookings)
    const manageButton = document.querySelector('.stat-card:nth-child(2) .stat-link');
    if (manageButton) {
        manageButton.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('bookings');
            setupBookingsPage(); // Initialize bookings page
        });
    }

    // Add event listener for the "Earnings" button
    const earningsButton = document.querySelector('.stat-card:nth-child(3) .stat-link');
    if (earningsButton) {
        earningsButton.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('earnings');
            loadEarningsPage(); // Initialize earnings page
        });
    }
}

/* Removed misplaced try/catch and duplicate dashboard update code */

// Bookings page functionality
function setupBookingsPage() {
    console.log('Setting up bookings page');
    const bookingsContainer = document.querySelector('#bookings-page');
    
    if (bookingsContainer) {
        // Initialize bookings data
        loadBookingsData();
    }
}

function loadBookingsData() {
    // You would typically fetch this data from your backend
    // For now, we'll show an empty state or sample data
    const bookingsPage = document.querySelector('#bookings-page');
    if (!bookingsPage) return;

    // Here you would fetch and display actual bookings data
    // For now, we'll just show a message
    const emptyState = bookingsPage.querySelector('.empty-state');
    if (emptyState) {
        emptyState.innerHTML = `
            <i class="fas fa-calendar"></i>
            <p>Your booking history will appear here.</p>
            <small>When guests book your properties, you'll see their reservations here.</small>
        `;
    }
}

// Earnings page functionality
function loadEarningsPage() {
    console.log('Loading earnings page');
    const earningsContainer = document.querySelector('.earnings-container');
    
    if (earningsContainer) {
        // Initialize earnings history
        loadEarningsHistory();
    }
}

function loadEarningsHistory() {
    const historySection = document.querySelector('.earnings-history-section');
    if (!historySection) return;

    // You would typically fetch this data from your backend
    // For now, we'll show the empty state
    const emptyState = historySection.querySelector('.empty-state');
    if (emptyState) {
        emptyState.innerHTML = `
            <i class="fas fa-chart-line empty-icon"></i>
            <p>At the moment there are no earnings.</p>
            <small>Your earnings will appear here once you start receiving payments.</small>
        `;
    }
}

// Page Navigation
function showPage(pageId) {
    // Hide all pages
    pages.forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const targetPage = document.getElementById(pageId + '-page');
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Load dashboard stats when dashboard page is shown
        if (pageId === 'dashboard') {
            loadDashboardStats();
        }
    }

    // Update active nav link
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    const activeLink = document.querySelector(`[data-page="${pageId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
        closeSidebarMenu();
    }

    // Update URL hash
    window.location.hash = pageId;
    
    // Initialize specific pages
    if (pageId === 'add-listing') {
        console.log('Initializing add-listing page'); // Debug log
        setTimeout(() => {
            setupAddListingPage();
        }, 100); // Small delay to ensure DOM is ready
    }
    
    if (pageId === 'my-listings') {
        console.log('Initializing my-listings page'); // Debug log
        setTimeout(() => {
            setupMyListingsPage();
        }, 100); // Small delay to ensure DOM is ready
    }
}

// Centralized navigation handler
function setupNavigation() {
    // Use event delegation for all navigation clicks
    document.addEventListener('click', (e) => {
        const link = e.target.closest('[data-page]');
        if (!link) return; // Not a navigation link
        
        e.preventDefault();
        const pageId = link.getAttribute('data-page');
        
        if (pageId === 'logout') {
            handleLogout();
        } else if (pageId) {
            showPage(pageId);
        }
    });
}

// Initialize navigation
setupNavigation();

// Handle dropdown menu link clicks using event delegation
document.addEventListener('click', (e) => {
    if (e.target.closest('.dropdown-menu a')) {
        const link = e.target.closest('.dropdown-menu a');
        const pageId = link.getAttribute('data-page');
        if (pageId) {
            e.preventDefault();
            
            // Handle logout specifically
            if (pageId === 'logout') {
                handleLogout();
            } else {
                showPage(pageId);
            }
            
            // Close dropdown after navigation
            const dropdownMenu = document.querySelector('.dropdown-menu');
            if (dropdownMenu) {
                dropdownMenu.style.display = 'none';
            }
        }
    }
});

// Handle logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear any stored user data
        localStorage.clear();
        sessionStorage.clear();
        
        // Show logout message
        showNotification('You have been successfully logged out', 'success');
        
        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    }
}

// Handle initial page load
function initializePage() {
    // Clean up any existing event listeners
    cleanupEventListeners();
    
    // Initialize core functionality
    setupNavigation();
    setupNotifications();
    
    // Load initial page
    const hash = window.location.hash.substring(1);
    if (hash && document.getElementById(hash + '-page')) {
        showPage(hash);
    } else {
        showPage('dashboard');
    }
}

// Clean up function to prevent memory leaks
function cleanupEventListeners() {
    // Remove any existing event listeners here
    const elements = document.querySelectorAll('[data-page]');
    elements.forEach(element => {
        element.replaceWith(element.cloneNode(true));
    });
}

// Initialize notifications system
function setupNotifications() {
    // Clear any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Setup Socket.IO connection for real-time notifications
    // Initialize socket connection
    socketConnection.setupConnection();

    // Set up notification bell click handler
    const notificationBtns = document.querySelectorAll('.notification-btn');
    notificationBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Reset notification count
            updateNotificationBadge(-parseInt(notificationBadges[0].textContent || '0'));
        });
    });
}

// Call initialization when DOM is ready
document.addEventListener('DOMContentLoaded', initializePage);

// User Menu Dropdown (Mobile)
const userToggle = document.querySelector('.user-toggle');
const dropdownMenu = document.querySelector('.dropdown-menu');

if (userToggle && dropdownMenu) {
    userToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        dropdownMenu.style.display = 'none';
    });
}

// Payout System Integration

// Fetch user's balance
async function fetchBalance() {
    try {
        const response = await fetch(`${BACKEND_URL}/payouts/balance`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch balance');
        }

        const data = await response.json();
        updateBalanceDisplay(data);
        return data;
    } catch (error) {
        console.error('Error fetching balance:', error);
        showNotification('Error fetching balance', 'error');
        throw error;
    }
}

// Update balance display in UI
function updateBalanceDisplay(balanceData) {
    const availableAmount = document.querySelector('.available-amount');
    const pendingAmount = document.querySelector('.pending-amount');
    const totalAmount = document.querySelector('.total-amount');
    
    if (availableAmount) {
        availableAmount.textContent = `${balanceData.availableBalance.toLocaleString()} XAF`;
    }
    if (pendingAmount) {
        pendingAmount.textContent = `${balanceData.pendingBalance.toLocaleString()} XAF`;
    }
    if (totalAmount) {
        totalAmount.textContent = `${balanceData.totalEarnings.toLocaleString()} XAF`;
    }

    // Update payout button state
    const payoutBtn = document.querySelector('.request-payout-btn');
    if (payoutBtn) {
        payoutBtn.disabled = !balanceData.canRequestPayout;
        payoutBtn.title = balanceData.canRequestPayout 
            ? 'Request a payout'
            : `Minimum payout amount is ${balanceData.minimumPayoutAmount.toLocaleString()} XAF`;
    }
}

// Save payout method
async function savePayoutMethod(payoutData) {
    try {
        const response = await fetch(`${BACKEND_URL}/payouts/payout-methods`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(payoutData)
        });

        if (!response.ok) {
            throw new Error('Failed to save payout method');
        }

        const result = await response.json();
        showNotification('Payout method saved successfully', 'success');
        return result;
    } catch (error) {
        console.error('Error saving payout method:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}

// Request a payout
async function requestPayout(amount, payoutMethodId) {
    try {
        const response = await fetch(`${BACKEND_URL}/payouts/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ amount, payoutMethodId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to request payout');
        }

        const result = await response.json();
        showNotification('Payout request submitted successfully', 'success');
        
        // Refresh balance display
        await fetchBalance();
        
        return result;
    } catch (error) {
        console.error('Error requesting payout:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}

// Fetch transaction history
async function fetchTransactionHistory(page = 1, filters = {}) {
    try {
        const queryParams = new URLSearchParams({
            page,
            ...filters
        });

        const response = await fetch(`${BACKEND_URL}/payouts/transactions?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch transaction history');
        }

        const data = await response.json();
        updateTransactionHistory(data);
        return data;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        showNotification('Error loading transaction history', 'error');
        throw error;
    }
}

// Update transaction history display
function updateTransactionHistory(data) {
    const container = document.querySelector('.transaction-history');
    if (!container) return;

    if (!data.transactions.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>No transactions found</p>
                <small>Your transaction history will appear here</small>
            </div>
        `;
        return;
    }

    const transactionsHTML = data.transactions.map(transaction => `
        <div class="transaction-item ${transaction.type}">
            <div class="transaction-info">
                <span class="transaction-type">${formatTransactionType(transaction.type)}</span>
                <span class="transaction-date">${formatDate(transaction.createdAt)}</span>
            </div>
            <div class="transaction-amount ${transaction.type === 'payout' ? 'negative' : 'positive'}">
                ${transaction.type === 'payout' ? '-' : '+'} ${transaction.amount.toLocaleString()} XAF
            </div>
            <div class="transaction-status">
                <span class="status-badge ${transaction.status}">${transaction.status}</span>
            </div>
        </div>
    `).join('');

    container.innerHTML = transactionsHTML;

    // Update pagination if needed
    if (data.pagination) {
        updatePagination(data.pagination);
    }
}

// Helper Functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTransactionType(type) {
    return type.charAt(0).toUpperCase() + type.slice(1);
}

function updatePagination(pagination) {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer || !pagination) return;

    const { currentPage, totalPages } = pagination;
    
    let paginationHTML = '';
    
    if (totalPages > 1) {
        paginationHTML = `
            <button class="page-btn prev" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <button class="page-btn number ${i === currentPage ? 'active' : ''}">${i}</button>
            `;
        }

        paginationHTML += `
            <button class="page-btn next" ${currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }

    paginationContainer.innerHTML = paginationHTML;

    // Add event listeners to pagination buttons
    paginationContainer.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (btn.disabled) return;

            let newPage = currentPage;
            if (btn.classList.contains('prev')) {
                newPage = currentPage - 1;
            } else if (btn.classList.contains('next')) {
                newPage = currentPage + 1;
            } else {
                newPage = parseInt(btn.textContent);
            }

            if (newPage !== currentPage) {
                fetchTransactionHistory(newPage);
            }
        });
    });
}

// Initialize payout functionality
document.addEventListener('DOMContentLoaded', () => {
    // Fetch initial balance
    if (document.querySelector('#earnings-page.active')) {
        fetchBalance();
        fetchTransactionHistory();
    }

    // Set up payout request button
    const payoutBtn = document.querySelector('#requestPayoutBtn');
    if (payoutBtn) {
        payoutBtn.addEventListener('click', () => {
            showPayoutDialog();
        });
    }

    // Set up transaction filters
    const transactionTypeSelect = document.querySelector('#transactionType');
    const timeRangeSelect = document.querySelector('#timeRange');

    if (transactionTypeSelect && timeRangeSelect) {
        transactionTypeSelect.addEventListener('change', updateFilters);
        timeRangeSelect.addEventListener('change', updateFilters);
    }
});

function updateFilters() {
    const type = document.querySelector('#transactionType').value;
    const timeRange = document.querySelector('#timeRange').value;

    fetchTransactionHistory(1, { type, timeRange });
}

// Desktop User Menu Dropdown
const desktopUserToggle = document.querySelector('.desktop-user-toggle');
const desktopDropdownMenu = document.querySelector('.desktop-dropdown');

if (desktopUserToggle && desktopDropdownMenu) {
    desktopUserToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        desktopDropdownMenu.style.display = desktopDropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.desktop-user-menu')) {
            desktopDropdownMenu.style.display = 'none';
        }
    });
}

// Desktop notification button
const desktopNotificationBtn = document.querySelector('.desktop-notification');
if (desktopNotificationBtn) {
    desktopNotificationBtn.addEventListener('click', () => {
        showNotification('You have no new notifications', 'info');
    });
}

/*===============================================================
 * FORM HANDLING AND SUBMISSION
 *===============================================================*/

function setupForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);

            // Ensure images are appended with correct field name
            const imageInput = form.querySelector('input[type="file"][name="images"]');
            if (imageInput && imageInput.files.length > 0) {
                for (const file of imageInput.files) {
                    formData.append('images', file);
                }
            }

            // Optional: If you have a rich text editor, update hidden textarea
            const descriptionField = form.querySelector('[name="description"]');
            const editorContent = form.querySelector('.editor-content');
            if (descriptionField && editorContent) {
                descriptionField.value = editorContent.innerHTML;
                formData.set('description', descriptionField.value);
            }

            // Show loading state on submit button if available
            const submitBtn = form.querySelector('button[type="submit"]');
            let originalText;
            if (submitBtn) {
                submitBtn.disabled = true;
                originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            }

            // Send data to backend using fetch
            fetch('https://real-estate-backend-d9es.onrender.com/api/listings', {
                method: 'POST',
                body: formData
            })
            .then(async response => {
                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(error || 'Failed to submit form');
                }
                return response.json();
            })
            .then(data => {
                showNotification('Form submitted successfully!', 'success');
                form.reset();
                if (editorContent) editorContent.innerHTML = '';
                // Refresh dashboard stats after adding new listing
                loadDashboardStats();
                // Refresh my listings page if it's open
                if (document.querySelector('#my-listings-page.active')) {
                    setupMyListingsPage();
                }
            })
            .catch(error => {
                showNotification('Error submitting form: ' + error.message, 'error');
            })
            .finally(() => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText || 'Submit';
                }
            });
        });
    });
}

/*===============================================================
 * NOTIFICATION SYSTEM
 *===============================================================*/

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
        border-radius: 8px;
        padding: 1rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1002;
        max-width: 400px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        animation: slideIn 0.3s ease;
    `;

    // Add slide in animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: inherit;
        padding: 0;
        margin-left: 0.5rem;
    `;

    closeBtn.addEventListener('click', () => {
        notification.remove();
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Profile Picture Upload Handler
async function uploadProfilePicture(file) {
    try {
        const formData = new FormData();
        formData.append('profilePicture', file);

        const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/profile/picture', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload profile picture');
        }

        const data = await response.json();
        return data.imageUrl;
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        throw error;
    }
}

async function deleteProfilePicture() {
    try {
        const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/profile/picture', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete profile picture');
        }

        return true;
    } catch (error) {
        console.error('Error deleting profile picture:', error);
        throw error;
    }
}

// Photo Upload Handler
function setupPhotoUpload() {
    const browseBtn = document.querySelector('.upload-buttons .btn-primary');
    const deleteBtn = document.querySelector('.upload-buttons .btn-secondary');
    const photoPlaceholder = document.querySelector('.photo-placeholder');

    if (browseBtn) {
        browseBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        photoPlaceholder.innerHTML = `<img src="${e.target.result}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                        showNotification('Profile picture uploaded successfully!', 'success');
                    };
                    reader.readAsDataURL(file);
                }
            });
            input.click();
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (photoPlaceholder.querySelector('img')) {
                photoPlaceholder.innerHTML = '<i class="fas fa-user-circle"></i>';
                showNotification('Profile picture removed', 'info');
            }
        });
    }
}

// Responsive Handling
function handleResize() {
    if (window.innerWidth > 768) {
        sidebar.classList.remove('open');
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Security Settings Integration
async function updatePassword(currentPassword, newPassword) {
    try {
        const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/profile/password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update password');
        }

        showNotification('Password updated successfully', 'success');
        return true;
    } catch (error) {
        console.error('Error updating password:', error);
        showNotification('Failed to update password', 'error');
        throw error;
    }
}

async function updateSecurityPreferences(preferences) {
    try {
        const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/profile/security', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(preferences)
        });

        if (!response.ok) {
            throw new Error('Failed to update security preferences');
        }

        showNotification('Security preferences updated', 'success');
        return await response.json();
    } catch (error) {
        console.error('Error updating security preferences:', error);
        showNotification('Failed to update security preferences', 'error');
        throw error;
    }
}

async function setup2FA() {
    try {
        // Request 2FA setup
        const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/profile/2fa/setup', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to setup 2FA');
        }

        const data = await response.json();
        return data; // Contains QR code and setup instructions
    } catch (error) {
        console.error('Error setting up 2FA:', error);
        throw error;
    }
}

// Password Strength Checker
function checkPasswordStrength(password) {
    let strength = 0;
    const feedback = [];

    if (password.length >= 8) {
        strength++;
    } else {
        feedback.push('At least 8 characters');
    }

    if (/[a-z]/.test(password)) {
        strength++;
    } else {
        feedback.push('Include lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
        strength++;
    } else {
        feedback.push('Include uppercase letters');
    }

    if (/[0-9]/.test(password)) {
        strength++;
    } else {
        feedback.push('Include numbers');
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
        strength++;
    } else {
        feedback.push('Include special characters');
    }

    return { strength, feedback };
}

// Setup Password Form
function setupPasswordForm() {
    const passwordForm = document.querySelector('.password-form');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    if (newPasswordInput) {
        // Add password strength indicator
        const strengthIndicator = document.createElement('div');
        strengthIndicator.className = 'password-strength';
        newPasswordInput.parentNode.appendChild(strengthIndicator);

        newPasswordInput.addEventListener('input', (e) => {
            const password = e.target.value;
            const { strength, feedback } = checkPasswordStrength(password);

            let strengthClass = 'strength-weak';
            let strengthText = 'Weak';

            if (strength >= 4) {
                strengthClass = 'strength-strong';
                strengthText = 'Strong';
            } else if (strength >= 2) {
                strengthClass = 'strength-medium';
                strengthText = 'Medium';
            }

            strengthIndicator.className = `password-strength ${strengthClass}`;
            strengthIndicator.textContent = password ? `Password strength: ${strengthText}` : '';
        });
    }

    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (newPassword !== confirmPassword) {
                showNotification('Passwords do not match!', 'error');
                return;
            }

            if (newPassword.length < 8) {
                showNotification('Password must be at least 8 characters long!', 'error');
                return;
            }

            // Simulate password change
            showNotification('Password changed successfully!', 'success');
            passwordForm.reset();
        });
    }
}

// Document Verification System
async function uploadVerificationDocuments(files) {
    try {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('documents', file);
        });

        const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/profile/verification/documents', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload verification documents');
        }

        return await response.json();
    } catch (error) {
        console.error('Error uploading verification documents:', error);
        throw error;
    }
}

async function checkVerificationStatus() {
    try {
        const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/profile/verification/status', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to check verification status');
        }

        const data = await response.json();
        return data.status; // 'pending', 'verified', or 'unverified'
    } catch (error) {
        console.error('Error checking verification status:', error);
        throw error;
    }
}

// Setup Verification Page
function setupVerificationPage() {
    const uploadBtn = document.querySelector('.upload-area .btn-secondary');
    const verifyBtn = document.querySelector('.verify-btn');
    const uploadArea = document.querySelector('.upload-area');
    const documentTypeSelect = document.querySelector('#document-type');
    const statusIndicator = document.querySelector('.verification-status');
    
    // Check current verification status on page load
    checkVerificationStatus().then(status => {
        updateVerificationUI(status);
    });

    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*,.pdf';
            input.multiple = true;

            input.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files);
                if (files.length > 0) {
                    try {
                        // Show loading state
                        uploadArea.style.borderColor = '#ffc107';
                        uploadArea.style.backgroundColor = '#fff3cd';
                        showNotification('Uploading documents...', 'info');

                        // Create FormData and append files
                        const formData = new FormData();
                        files.forEach(file => {
                            formData.append('documents', file);
                        });
                        
                        if (documentTypeSelect) {
                            formData.append('documentType', documentTypeSelect.value);
                        }

                        // Upload documents
                        const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/verification/submit', {
                            method: 'POST',
                            body: formData,
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            }
                        });

                        if (!response.ok) {
                            throw new Error('Failed to upload documents');
                        }

                        // Update UI on success
                        uploadArea.style.borderColor = '#28a745';
                        uploadArea.style.backgroundColor = '#d4edda';

                        const fileNames = files.map(f => f.name).join(', ');
                        const uploadedText = document.createElement('p');
                        uploadedText.textContent = `Uploaded: ${fileNames}`;
                        uploadedText.style.color = '#28a745';
                        uploadedText.style.fontWeight = '500';

                        // Remove existing uploaded text
                        const existingText = uploadArea.querySelector('.uploaded-text');
                        if (existingText) {
                            existingText.remove();
                        }

                        uploadedText.className = 'uploaded-text';
                        uploadArea.appendChild(uploadedText);

                        showNotification('Documents uploaded successfully!', 'success');
                        
                        // Refresh verification status
                        const status = await checkVerificationStatus();
                        updateVerificationUI(status);

                    } catch (error) {
                        console.error('Upload error:', error);
                        uploadArea.style.borderColor = '#dc3545';
                        uploadArea.style.backgroundColor = '#f8d7da';
                        showNotification(error.message, 'error');
                    }
                }
            });

            input.click();
        });
    }

    if (verifyBtn) {
        verifyBtn.addEventListener('click', async () => {
            const uploadedText = uploadArea.querySelector('.uploaded-text');
            if (!uploadedText) {
                showNotification('Please upload your documents first!', 'error');
                return;
            }

            try {
                // Show processing state
                verifyBtn.disabled = true;
                verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

                // Check status after submission
                const status = await checkVerificationStatus();
                updateVerificationUI(status);

                showNotification('Documents submitted for verification! We will review them within 24-48 hours.', 'success');
            } catch (error) {
                console.error('Verification error:', error);
                showNotification('Error processing verification request', 'error');
                verifyBtn.disabled = false;
                verifyBtn.innerHTML = 'Submit for Verification';
            }
        });
    }

    // Handle resubmission if needed
    const resubmitBtn = document.querySelector('.resubmit-btn');
    if (resubmitBtn) {
        resubmitBtn.addEventListener('click', () => {
            // Reset the form and status
            uploadArea.style.borderColor = '';
            uploadArea.style.backgroundColor = '';
            const uploadedText = uploadArea.querySelector('.uploaded-text');
            if (uploadedText) {
                uploadedText.remove();
            }
            
            // Enable upload button
            if (uploadBtn) {
                uploadBtn.disabled = false;
            }
            
            showNotification('You can now upload new documents', 'info');
        });
    }
}

// Check verification status
async function checkVerificationStatus() {
    try {
        const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/verification/status', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to check verification status');
        }

        return await response.json();
    } catch (error) {
        console.error('Error checking verification status:', error);
        throw error;
    }
}

// Update UI based on verification status
function updateVerificationUI(status) {
    const statusIndicator = document.querySelector('.verification-status');
    const uploadArea = document.querySelector('.upload-area');
    const verifyBtn = document.querySelector('.verify-btn');
    const resubmitBtn = document.querySelector('.resubmit-btn');
    const rejectionReason = document.querySelector('.rejection-reason');

    if (!statusIndicator) return;

    // Remove all status classes
    statusIndicator.classList.remove('pending', 'approved', 'rejected');
    
    // Update UI based on status
    switch(status.status) {
        case 'pending':
            statusIndicator.classList.add('pending');
            statusIndicator.innerHTML = `
                <i class="fas fa-clock"></i>
                <div>
                    <h4>Verification Pending</h4>
                    <p>Your documents are under review. This usually takes 24-48 hours.</p>
                </div>
            `;
            if (uploadArea) uploadArea.style.display = 'none';
            if (verifyBtn) verifyBtn.style.display = 'none';
            if (resubmitBtn) resubmitBtn.style.display = 'none';
            break;

        case 'approved':
            statusIndicator.classList.add('approved');
            statusIndicator.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <div>
                    <h4>Verification Approved</h4>
                    <p>Your account is fully verified. You can now access all features.</p>
                </div>
            `;
            if (uploadArea) uploadArea.style.display = 'none';
            if (verifyBtn) verifyBtn.style.display = 'none';
            if (resubmitBtn) resubmitBtn.style.display = 'none';
            break;

        case 'rejected':
            statusIndicator.classList.add('rejected');
            statusIndicator.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                <div>
                    <h4>Verification Rejected</h4>
                    <p>Please check the rejection reason and resubmit your documents.</p>
                </div>
            `;
            if (rejectionReason) {
                rejectionReason.textContent = status.rejectionReason || 'Documents did not meet our requirements.';
                rejectionReason.style.display = 'block';
            }
            if (uploadArea) uploadArea.style.display = 'block';
            if (verifyBtn) verifyBtn.style.display = 'block';
            if (resubmitBtn) resubmitBtn.style.display = 'block';
            break;

        default:
            statusIndicator.classList.add('pending');
            statusIndicator.innerHTML = `
                <i class="fas fa-upload"></i>
                <div>
                    <h4>Verification Required</h4>
                    <p>Please upload your documents to verify your account.</p>
                </div>
            `;
            if (uploadArea) uploadArea.style.display = 'block';
            if (verifyBtn) verifyBtn.style.display = 'block';
            if (resubmitBtn) resubmitBtn.style.display = 'none';
    }
}

// Payout System Integration
const BACKEND_URL = 'https://real-estate-backend-d9es.onrender.com/api';
const isDevelopment = true; // Set this based on your environment

// Show development mode notice
if (isDevelopment) {
    const notice = document.createElement('div');
    notice.className = 'dev-mode-notice';
    notice.innerHTML = `
        <i class="fas fa-code"></i>
        Development Mode: Payouts are simulated
        <button class="close-notice">×</button>
    `;
    document.body.appendChild(notice);

    // Close button functionality
    notice.querySelector('.close-notice').addEventListener('click', () => {
        notice.remove();
    });
}

// Fetch user's balance
async function fetchBalance() {
    try {
        const response = await fetch(`${BACKEND_URL}/payouts/balance`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch balance');
        }

        const data = await response.json();
        updateBalanceDisplay(data);
        return data;
    } catch (error) {
        console.error('Error fetching balance:', error);
        showNotification('Error fetching balance', 'error');
        throw error;
    }
}

// Update balance display in UI
function updateBalanceDisplay(balanceData) {
    const balanceAmount = document.querySelector('.balance-amount');
    const pendingAmount = document.querySelector('.pending-amount');
    const availableAmount = document.querySelector('.available-amount');
    
    if (balanceAmount) {
        balanceAmount.textContent = `${balanceData.availableBalance.toLocaleString()} ${balanceData.currency}`;
    }
    if (pendingAmount) {
        pendingAmount.textContent = `${balanceData.pendingBalance.toLocaleString()} ${balanceData.currency}`;
    }
    if (availableAmount) {
        availableAmount.textContent = `${balanceData.availableBalance.toLocaleString()} ${balanceData.currency}`;
    }

    // Update payout button state
    const payoutBtn = document.querySelector('.request-payout-btn');
    if (payoutBtn) {
        payoutBtn.disabled = !balanceData.canRequestPayout;
        if (!balanceData.canRequestPayout) {
            payoutBtn.title = `Minimum payout amount is ${balanceData.minimumPayoutAmount.toLocaleString()} ${balanceData.currency}`;
        }
    }
}

// Save payout method
async function savePayoutMethod(payoutData) {
    try {
        const response = await fetch(`${BACKEND_URL}/payouts/payout-methods`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(payoutData)
        });

        if (!response.ok) {
            throw new Error('Failed to save payout method');
        }

        const result = await response.json();
        showNotification('Payout method saved successfully', 'success');
        return result;
    } catch (error) {
        console.error('Error saving payout method:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}

// Request a payout
async function requestPayout(amount, payoutMethodId) {
    try {
        const response = await fetch(`${BACKEND_URL}/payouts/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ amount, payoutMethodId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to request payout');
        }

        const result = await response.json();
        showNotification('Payout request submitted successfully', 'success');
        
        // Refresh balance display
        await fetchBalance();
        
        return result;
    } catch (error) {
        console.error('Error requesting payout:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}

// Fetch transaction history
async function fetchTransactionHistory(page = 1, filters = {}) {
    try {
        const queryParams = new URLSearchParams({
            page,
            ...filters
        });

        const response = await fetch(`${BACKEND_URL}/payouts/transactions?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch transaction history');
        }

        const data = await response.json();
        updateTransactionHistory(data);
        return data;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        showNotification('Error loading transaction history', 'error');
        throw error;
    }
}

// Update transaction history display
function updateTransactionHistory(data) {
    const container = document.querySelector('.transaction-history');
    if (!container) return;

    if (!data.transactions.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>No transactions found</p>
            </div>
        `;
        return;
    }

    const transactionsHTML = data.transactions.map(transaction => `
        <div class="transaction-item ${transaction.type} ${transaction.status}">
            <div class="transaction-info">
                <span class="transaction-type">${formatTransactionType(transaction.type)}</span>
                <span class="transaction-date">${formatDate(transaction.createdAt)}</span>
            </div>
            <div class="transaction-amount ${transaction.type === 'payout' ? 'negative' : 'positive'}">
                ${transaction.type === 'payout' ? '-' : '+'} ${transaction.amount.toLocaleString()} ${transaction.currency}
            </div>
            <div class="transaction-status">
                <span class="status-badge ${transaction.status}">${transaction.status}</span>
            </div>
        </div>
    `).join('');

    container.innerHTML = transactionsHTML;

    // Update pagination if needed
    updatePagination(data.pagination);
}

async function getPayoutMethods() {
    try {
        const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/profile/payout-methods', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch payout methods');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching payout methods:', error);
        throw error;
    }
}

// Setup Payout Method Form
async function savePayoutMethod(data) {
    try {
        const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/payout/methods', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: data.payoutMethod,
                details: {
                    accountName: `${data.firstName} ${data.lastName}`,
                    accountNumber: data.accountNumber,
                    bankName: data.bankName,
                    phoneNumber: data.phoneNumber,
                    provider: data.provider
                }
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to save payout method');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error saving payout method:', error);
        throw error;
    }
}

function setupPayoutMethodForm() {
    const payoutMethodForm = document.querySelector('.payout-method-form');
    const setPayoutMethodBtn = document.querySelector('.set-method-btn');
    const requestPayoutBtn = document.querySelector('.request-payout-btn');

    if (payoutMethodForm) {
        payoutMethodForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Validate required fields
            const requiredFields = ['payout-amount-method', 'first-name-method', 'last-name-method', 'street-address-method', 'city-method', 'state-method', 'zip-code-method', 'payout-method-select'];
            const missingFields = requiredFields.filter(field => {
                const input = document.getElementById(field);
                return !input || !input.value.trim();
            });

            if (missingFields.length > 0) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }

            const payoutAmount = parseFloat(document.getElementById('payout-amount-method').value);
            if (payoutAmount < 50000) {
                showNotification('Minimum payout amount is 50,000 FCFA', 'error');
                return;
            }

            // Handle saving payout method details
            const formData = new FormData(payoutMethodForm);
            const data = Object.fromEntries(formData);
            
            // Store payout method data for use in payout requests
            localStorage.setItem('payoutMethodData', JSON.stringify({
                payoutAmount: data['payout-amount-method'],
                firstName: data['first-name-method'],
                lastName: data['last-name-method'],
                companyName: data['company-name-method'],
                taxId: data['tax-id-method'],
                streetAddress: data['street-address-method'],
                aptSuite: data['apt-suite-method'],
                city: data['city-method'],
                state: data['state-method'],
                zipCode: data['zip-code-method'],
                payoutMethod: data['payout-method-select']
            }));
            
            console.log('Payout method saved:', data);
            showNotification('Payout method updated successfully!', 'success');
        });
    }

    if (setPayoutMethodBtn) {
        setPayoutMethodBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Trigger form submission for saving payout method
            if (payoutMethodForm) {
                const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
                payoutMethodForm.dispatchEvent(submitEvent);
            }
        });
    }

    if (requestPayoutBtn) {
        requestPayoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Navigate to the payout page using the existing navigation system
            showPage('payouts');
        });
    }
}


// Request a payout
async function requestPayout(amount) {
    try {
        const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/payout/request', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amount
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit payout request');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error requesting payout:', error);
        throw error;
    }
}

// Setup Payout Form
function setupPayoutForm() {
    const payoutForm = document.querySelector('.payout-form');
    const payoutAmountInput = document.getElementById('payout-amount');

    if (payoutAmountInput) {
        payoutAmountInput.addEventListener('input', (e) => {
            const amount = parseFloat(e.target.value);
            const minAmount = 50000;

            if (amount > 0 && amount < minAmount) {
                e.target.setCustomValidity(`Minimum payout amount is ${minAmount} FCFA`);
                e.target.style.borderColor = '#dc3545';
            } else if (amount >= minAmount) {
                e.target.setCustomValidity('');
                e.target.style.borderColor = '#28a745';
            } else {
                e.target.setCustomValidity('');
                e.target.style.borderColor = '#e9ecef';
            }
        });
    }

    if (payoutForm) {
        payoutForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const payoutAmount = parseFloat(payoutAmountInput.value);
            const availableBalance = 0; // This would come from your backend
            const minAmount = 50000;

            // Validation
            if (!payoutAmount || isNaN(payoutAmount)) {
                showNotification('Please enter a valid payout amount', 'error');
                return;
            }

            if (payoutAmount < minAmount) {
                showNotification(`Minimum payout amount is ${minAmount.toLocaleString()} FCFA`, 'error');
                return;
            }

            if (payoutAmount > availableBalance && availableBalance > 0) {
                showNotification('Payout amount cannot exceed available balance', 'error');
                return;
            }

            // Check if user has set up payout method
            const payoutMethodData = localStorage.getItem('payoutMethodData');
            if (!payoutMethodData) {
                showNotification('Please set up your payout method first in Profile > Payout Method', 'error');
                return;
            }

            // Simulate payout request
            const submitBtn = payoutForm.querySelector('.request-payout-submit-btn');
            const originalText = submitBtn.innerHTML;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                
                // Create payout record (in real app, this would be sent to backend)
                const payoutRequest = {
                    id: Date.now(),
                    amount: payoutAmount,
                    status: 'pending',
                    requestDate: new Date().toISOString(),
                    method: JSON.parse(payoutMethodData).payoutMethod
                };

                // Store payout request (in real app, this would be handled by backend)
                const existingPayouts = JSON.parse(localStorage.getItem('payoutHistory') || '[]');
                existingPayouts.unshift(payoutRequest);
                localStorage.setItem('payoutHistory', JSON.stringify(existingPayouts));

                showNotification(`Payout request for ${payoutAmount.toLocaleString()} FCFA submitted successfully! You will receive confirmation within 24-48 hours.`, 'success');
                payoutForm.reset();
                
                // Reset input border color
                if (payoutAmountInput) {
                    payoutAmountInput.style.borderColor = '#e9ecef';
                }
            }, 2000);
        });
    }
}

// Fetch payout history
async function fetchPayoutHistory() {
    try {
        const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/payout/requests', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        updatePayoutHistory(data);
    } catch (error) {
        console.error('Error fetching payout history:', error);
        showNotification('Failed to fetch payout history', 'error');
    }
}

function updatePayoutHistory(payouts) {
    const payoutSection = document.querySelector('#wallet-page .wallet-section:last-child');
    if (!payoutSection) return;

    const emptyState = payoutSection.querySelector('.empty-state');
    if (!payouts || payouts.length === 0) {
        if (emptyState) {
            emptyState.innerHTML = `
                <i class="fas fa-money-bill-wave empty-icon"></i>
                <p>At the moment there are no payouts.</p>
                <small class="info-update">Set up your payout method to request withdrawals</small>
            `;
        }
        return;
    }

    const payoutList = document.createElement('div');
    payoutList.className = 'payout-history-list';
    payoutList.innerHTML = payouts.map(payout => `
        <div class="payout-item">
            <div class="payout-info">
                <h4>${payout.amount.toLocaleString()} XAF</h4>
                <p>Requested on ${new Date(payout.requestDate).toLocaleDateString()}</p>
            </div>
            <span class="status-badge ${payout.status}">${payout.status}</span>
        </div>
    `).join('');

    if (emptyState) {
        emptyState.replaceWith(payoutList);
    }
}

// Setup Wallet Page
function setupWalletPage() {
    const detailsBtn = document.querySelector('.details-btn');
    const manageBtn = document.querySelector('.manage-btn');
    
    // Fetch balance and payout history when wallet page is loaded
    fetchBalance();
    fetchPayoutHistory();

    if (detailsBtn) {
        detailsBtn.addEventListener('click', () => {
            showNotification('Earnings details feature coming soon!', 'info');
        });
    }

    if (manageBtn) {
        manageBtn.addEventListener('click', () => {
            showPage('bookings');
        });
    }
}

// Setup Earnings Page
function setupEarningsPage() {
    const feeBtn = document.querySelector('.fee-btn');

    if (feeBtn) {
        feeBtn.addEventListener('click', () => {
            showNotification('Host fee information: 10% is deducted from each booking', 'info');
        });
    }
}

// Setup Listings Page
function setupListingsPage() {
    const searchBtn = document.querySelector('.search-btn');
    const searchInput = document.querySelector('.search-input');
    const filterButtons = document.querySelectorAll('.btn-filter');

    // Search functionality
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                showNotification(`Searching for: "${searchTerm}"`, 'info');
                // Here you would implement actual search functionality
            } else {
                showNotification('Please enter a search term', 'error');
            }
        });

        // Allow search on Enter key
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }

    // Filter functionality
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            const filter = button.getAttribute('data-filter');
            showNotification(`Filtering by: ${filter.charAt(0).toUpperCase() + filter.slice(1)}`, 'info');
            
            // Here you would implement actual filtering functionality
        });
    });
}

// Setup Invoices Page
function setupInvoicesPage() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const typeFilter = document.getElementById('type-filter');
    const statusFilter = document.getElementById('status-filter');

    // Handle filter changes
    function handleFilterChange() {
        const startDate = startDateInput ? startDateInput.value : '';
        const endDate = endDateInput ? endDateInput.value : '';
        const type = typeFilter ? typeFilter.value : '';
        const status = statusFilter ? statusFilter.value : '';

        // Build filter message
        let filterMsg = 'Filtering invoices';
        const filters = [];
        
        if (startDate) filters.push(`from ${startDate}`);
        if (endDate) filters.push(`to ${endDate}`);
        if (type) filters.push(`type: ${type}`);
        if (status) filters.push(`status: ${status}`);

        if (filters.length > 0) {
            filterMsg += ` (${filters.join(', ')})`;
            showNotification(filterMsg, 'info');
        }

        // Here you would implement actual filtering logic
        console.log('Invoice filters:', { startDate, endDate, type, status });
    }

    // Add event listeners for filter inputs
    if (startDateInput) {
        startDateInput.addEventListener('change', handleFilterChange);
    }

    if (endDateInput) {
        endDateInput.addEventListener('change', handleFilterChange);
    }

    if (typeFilter) {
        typeFilter.addEventListener('change', handleFilterChange);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', handleFilterChange);
    }

    // Validate date range
    function validateDateRange() {
        if (startDateInput && endDateInput && startDateInput.value && endDateInput.value) {
            const startDate = new Date(startDateInput.value);
            const endDate = new Date(endDateInput.value);

            if (startDate > endDate) {
                showNotification('Start date cannot be later than end date', 'error');
                endDateInput.value = '';
            }
        }
    }

    if (startDateInput) {
        startDateInput.addEventListener('change', validateDateRange);
    }

    if (endDateInput) {
        endDateInput.addEventListener('change', validateDateRange);
    }
}

/*===============================================================
 * MESSAGING SYSTEM
 *===============================================================*/

function setupMessagesPage() {
    const usersList = document.getElementById('users-list');
    const userSearch = document.getElementById('user-search');
    const categoryButtons = document.querySelectorAll('.btn-category');
    const chatWelcome = document.getElementById('chat-welcome');
    const chatMessages = document.getElementById('chat-messages');
    const messageInputArea = document.getElementById('message-input-area');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const chatUserName = document.getElementById('chat-user-name');
    const chatUserStatus = document.getElementById('chat-user-status');
    const quickActionButtons = document.querySelectorAll('.btn-quick');
    const newChatBtn = document.getElementById('new-chat-btn');
    const startChatBtn = document.getElementById('start-chat-btn');

    let currentChatUser = null;
    let chatHistory = {};

    // Sample chat data
    const sampleMessages = {
        1: [
            { type: 'received', text: 'Hi! I saw your listing for the downtown apartment. Is it still available?', time: '2 hours ago' },
            { type: 'sent', text: 'Hello! Yes, it\'s still available. Would you like to schedule a viewing?', time: '2 hours ago' },
            { type: 'received', text: 'That would be great! When would be a good time?', time: '1 hour ago' },
            { type: 'sent', text: 'How about tomorrow at 3 PM?', time: '1 hour ago' }
        ],
        2: [
            { type: 'received', text: 'Hello, I\'m looking for a 2-bedroom apartment in the city center. Do you have anything available?', time: '3 hours ago' }
        ],
        3: [
            { type: 'received', text: 'Hi there! Your property looks amazing. Could you tell me more about the amenities?', time: '1 day ago' }
        ]
    };

    // User selection handler
    function handleUserSelection() {
        const userItems = document.querySelectorAll('.user-item');
        
        userItems.forEach(item => {
            item.addEventListener('click', () => {
                // Remove active class from all users
                userItems.forEach(u => u.classList.remove('active'));
                
                // Add active class to selected user
                item.classList.add('active');
                
                // Get user data
                const userId = item.getAttribute('data-user-id');
                const userName = item.querySelector('h4').textContent;
                const userType = item.querySelector('.user-type').textContent;
                const userStatus = item.querySelector('.last-seen').textContent;
                
                // Update chat header
                chatUserName.textContent = userName;
                chatUserStatus.textContent = userType + ' • ' + userStatus;
                
                // Show chat interface
                chatWelcome.style.display = 'none';
                chatMessages.style.display = 'block';
                messageInputArea.style.display = 'block';
                
                // Load chat messages
                loadChatMessages(userId);
                
                // Update current chat user
                currentChatUser = userId;
                
                // Remove message count indicator
                const messageCount = item.querySelector('.message-count');
                if (messageCount) {
                    messageCount.remove();
                }
                
                showNotification(`Started chat with ${userName}`, 'success');
            });
        });
    }

    // Load chat messages for selected user
    function loadChatMessages(userId) {
        const messagesContainer = chatMessages;
        messagesContainer.innerHTML = '';
        
        const messages = sampleMessages[userId] || [];
        
        messages.forEach(message => {
            const messageElement = createMessageElement(message);
            messagesContainer.appendChild(messageElement);
        });
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Create message element
    function createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.type}`;
        if (message.id) {
            messageDiv.setAttribute('data-message-id', message.id);
        }
        
        let statusIcon = '';
        if (message.type === 'sent') {
            statusIcon = `
                <span class="message-status ${message.status}">
                    ${message.status === 'sent' ? '✓' : message.status === 'delivered' ? '✓✓' : message.status === 'read' ? '✓✓' : ''}
                </span>
            `;
        }
        
        messageDiv.innerHTML = `
            <div class="message-bubble">
                ${message.text}
                <div class="message-info">
                    <span class="message-time">${message.time}</span>
                    ${statusIcon}
                </div>
            </div>
        `;
        
        return messageDiv;
    }

    // Handle new message reception
    window.handleNewMessage = (message) => {
        if (message.senderId !== currentChatUser && message.receiverId !== currentChatUser) {
            return; // Message not for current chat
        }

        const newMessage = {
            type: message.senderId === currentChatUser ? 'received' : 'sent',
            text: message.content,
            time: formatTime(message.timestamp),
            id: message._id,
            status: 'delivered'
        };

        const messageElement = createMessageElement(newMessage);
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // If this is a received message, mark it as read
        if (newMessage.type === 'received') {
            socketConnection.markMessageAsRead(message.conversationId, message._id);
        }
    }

    // Send message handler
    async function handleSendMessage() {
        const messageText = messageInput.value.trim();
        
        if (!messageText || !currentChatUser) {
            return;
        }

        // Prepare message data
        const messageData = {
            content: messageText,
            receiverId: currentChatUser,
            type: 'text',
            timestamp: new Date().toISOString()
        };

        try {
            // Send message via API
            const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/messages/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(messageData)
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const sentMessage = await response.json();

            // Create new message element
            const newMessage = {
                type: 'sent',
                text: messageText,
                time: 'Just now',
                status: 'sent',
                id: sentMessage._id
            };

            // Add message to chat display
            const messageElement = createMessageElement(newMessage);
            chatMessages.appendChild(messageElement);

            // Emit socket event
            socketConnection.sendMessage(currentChatUser, sentMessage);

            // Clear input and adjust
            messageInput.value = '';
            adjustTextareaHeight();

            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // End typing indicator
            socketConnection.sendTypingEnd(currentChatUser);

        } catch (error) {
            console.error('Error sending message:', error);
            showNotification('Failed to send message. Please try again.', 'error');
        }
        
        // Simulate auto-response after a delay
        setTimeout(() => {
            const responseMessage = {
                type: 'received',
                text: getAutoResponse(messageText),
                time: 'Just now'
            };
            
            sampleMessages[currentChatUser].push(responseMessage);
            const responseElement = createMessageElement(responseMessage);
            chatMessages.appendChild(responseElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 2000);
    }

    // Auto response generator
    function getAutoResponse(message) {
        const responses = [
            "Thanks for your message! Let me get back to you with more details.",
            "That sounds great! I'll check my calendar and get back to you.",
            "I appreciate your interest. Let me gather the information you need.",
            "Perfect! I'll send you more details shortly.",
            "Thank you for reaching out. I'll respond with the details soon."
        ];
        
        if (message.toLowerCase().includes('viewing')) {
            return "I'd be happy to arrange a viewing. What days work best for you?";
        } else if (message.toLowerCase().includes('price')) {
            return "The price is negotiable depending on the lease terms. Let's discuss!";
        } else if (message.toLowerCase().includes('available')) {
            return "Yes, it's still available! Would you like to know more details?";
        }
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Adjust textarea height
    function adjustTextareaHeight() {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    }

    // Search users functionality
    function handleUserSearch() {
        const searchTerm = userSearch.value.toLowerCase();
        const userItems = document.querySelectorAll('.user-item');
        
        userItems.forEach(item => {
            const userName = item.querySelector('h4').textContent.toLowerCase();
            const userType = item.querySelector('.user-type').textContent.toLowerCase();
            
            if (userName.includes(searchTerm) || userType.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // Filter users by category
    function handleCategoryFilter() {
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');
                
                const category = button.getAttribute('data-category');
                const userItems = document.querySelectorAll('.user-item');
                
                userItems.forEach(item => {
                    const userCategory = item.getAttribute('data-category');
                    
                    if (category === 'all' || userCategory === category) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
                
                showNotification(`Showing ${category === 'all' ? 'all users' : category + 's'}`, 'info');
            });
        });
    }

    // Quick actions handler
    function handleQuickActions() {
        quickActionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                
                switch (action) {
                    case 'schedule-viewing':
                        if (currentChatUser) {
                            const message = "I'd like to schedule a viewing. When would be a good time for you?";
                            messageInput.value = message;
                            handleSendMessage();
                        }
                        break;
                    case 'share-listing':
                        if (currentChatUser) {
                            const message = "Here's a link to one of my available listings: [Property Link]";
                            messageInput.value = message;
                            handleSendMessage();
                        }
                        break;
                    case 'make-offer':
                        if (currentChatUser) {
                            const message = "I'd like to make an offer. Can we discuss the terms?";
                            messageInput.value = message;
                            handleSendMessage();
                        }
                        break;
                }
            });
        });
    }

    // New chat functionality
    function handleNewChat() {
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => {
                showNotification('New chat feature coming soon! For now, select a user from the list to start chatting.', 'info');
            });
        }

        if (startChatBtn) {
            startChatBtn.addEventListener('click', () => {
                // Select first available user
                const firstUser = document.querySelector('.user-item');
                if (firstUser) {
                    firstUser.click();
                }
            });
        }
    }

    // Mobile sidebar toggle
    function handleMobileSidebar() {
        const chatHeader = document.querySelector('.chat-header');
        const usersSidebar = document.querySelector('.users-sidebar');
        
        if (window.innerWidth <= 768 && chatHeader) {
            chatHeader.addEventListener('click', (e) => {
                if (e.target === chatHeader || e.target.closest('.chat-user-info')) {
                    usersSidebar.classList.toggle('open');
                }
            });
            
            // Close sidebar when selecting user on mobile
            const userItems = document.querySelectorAll('.user-item');
            userItems.forEach(item => {
                item.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        usersSidebar.classList.remove('open');
                    }
                });
            });
        }
    }

    // Initialize event listeners
    if (userSearch) {
        userSearch.addEventListener('input', handleUserSearch);
    }

    // Handle online/offline status
    window.handleUserOnline = (userId) => {
        updateUserStatus(userId, 'online');
    };

    window.handleUserOffline = (userId) => {
        updateUserStatus(userId, 'offline');
    };

    function updateUserStatus(userId, status) {
        // Update user in sidebar
        const userItem = document.querySelector(`.user-item[data-user-id="${userId}"]`);
        if (userItem) {
            const statusElement = userItem.querySelector('.user-status');
            if (statusElement) {
                statusElement.className = `user-status ${status}`;
                statusElement.textContent = status;
            }
        }

        // Update chat header if this is the current chat
        if (userId === currentChatUser) {
            const chatUserStatus = document.getElementById('chat-user-status');
            if (chatUserStatus) {
                chatUserStatus.textContent = `${status.charAt(0).toUpperCase() + status.slice(1)}`;
            }
        }
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', handleSendMessage);
    }

    if (messageInput) {
        let typingTimeout;
        
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            } else if (currentChatUser) {
                // Send typing indicator
                socketConnection.sendTypingStart(currentChatUser);
                
                // Clear existing timeout
                clearTimeout(typingTimeout);
                
                // Set new timeout to end typing status
                typingTimeout = setTimeout(() => {
                    socketConnection.sendTypingEnd(currentChatUser);
                }, 2000);
            }
        });
        
        messageInput.addEventListener('input', adjustTextareaHeight);

        // Clear typing status when input is empty
        messageInput.addEventListener('blur', () => {
            if (currentChatUser) {
                socketConnection.sendTypingEnd(currentChatUser);
            }
        });
    }

    // Handle typing indicators
    window.handleTypingStart = (userId) => {
        if (userId !== currentChatUser) return;
        
        const typingIndicator = document.querySelector('.typing-indicator');
        if (!typingIndicator) {
            const indicator = document.createElement('div');
            indicator.className = 'typing-indicator';
            indicator.innerHTML = 'Typing...';
            chatMessages.appendChild(indicator);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    };

    window.handleTypingEnd = (userId) => {
        if (userId !== currentChatUser) return;
        
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    };

    // Attachment button
    const attachmentBtn = document.getElementById('attachment-btn');
    if (attachmentBtn) {
        attachmentBtn.addEventListener('click', () => {
            showNotification('File attachment feature coming soon!', 'info');
        });
    }

    // Emoji button
    const emojiBtn = document.getElementById('emoji-btn');
    if (emojiBtn) {
        emojiBtn.addEventListener('click', () => {
            showNotification('Emoji picker coming soon!', 'info');
        });
    }

    // Chat action buttons
    const viewProfileBtn = document.getElementById('view-profile-btn');
    const callBtn = document.getElementById('call-btn');
    const moreOptionsBtn = document.getElementById('more-options-btn');

    if (viewProfileBtn) {
        viewProfileBtn.addEventListener('click', () => {
            showNotification('Profile view feature coming soon!', 'info');
        });
    }

    if (callBtn) {
        callBtn.addEventListener('click', () => {
            showNotification('Video call feature coming soon!', 'info');
        });
    }

    if (moreOptionsBtn) {
        moreOptionsBtn.addEventListener('click', () => {
            showNotification('More options coming soon!', 'info');
        });
    }

    // Initialize all handlers
    handleUserSelection();
    handleCategoryFilter();
    handleQuickActions();
    handleNewChat();
    handleMobileSidebar();

    // Handle window resize for mobile
    window.addEventListener('resize', handleMobileSidebar);
}

/*===============================================================
 * SETTINGS PAGE FUNCTIONALITY
 *===============================================================*/

function setupSettingsPage() {
    const saveSettingsBtn = document.querySelector('.save-settings-btn');
    const resetSettingsBtn = document.querySelector('.reset-settings-btn');
    const currencySelect = document.getElementById('currency-select');
    const languageSelect = document.getElementById('language-select');
    const themeSelect = document.getElementById('theme-select');
    const toggleSwitches = document.querySelectorAll('.toggle-switch input[type="checkbox"]');
    let hasUnsavedChanges = false;

    // Function to update save button state
    function updateSaveButtonState(hasChanges) {
        hasUnsavedChanges = hasChanges;
        if (saveSettingsBtn) {
            saveSettingsBtn.classList.toggle('btn-pulse', hasChanges);
            saveSettingsBtn.innerHTML = hasChanges ? 
                '<i class="fas fa-exclamation-circle"></i> Save Changes*' :
                '<i class="fas fa-save"></i> Save Settings';
        }
    }

    // Load saved settings from localStorage
    function loadSettings() {
        const savedSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
        
        // Apply currency setting
        if (savedSettings.currency && currencySelect) {
            currencySelect.value = savedSettings.currency;
            // Only update currency display if it's different from default
            if (savedSettings.currency !== 'XAF') {
                updateCurrencyDisplay(savedSettings.currency);
            }
        }
        // Don't automatically update currency on initial load to preserve HTML structure

        // Apply language setting
        if (savedSettings.language && languageSelect) {
            languageSelect.value = savedSettings.language;
        }

        // Apply theme setting
        if (savedSettings.theme && themeSelect) {
            themeSelect.value = savedSettings.theme;
            applyTheme(savedSettings.theme);
        }

        // Apply timezone setting
        if (savedSettings.timezone) {
            const timezoneSelect = document.getElementById('timezone-select');
            if (timezoneSelect) timezoneSelect.value = savedSettings.timezone;
        }

        // Apply date format setting
        if (savedSettings.dateFormat) {
            const dateFormatSelect = document.getElementById('date-format-select');
            if (dateFormatSelect) dateFormatSelect.value = savedSettings.dateFormat;
        }

        // Apply toggle settings
        Object.entries(savedSettings.toggles || {}).forEach(([key, value]) => {
            const toggle = document.getElementById(key);
            if (toggle) {
                toggle.checked = value;
            }
        });

        // Apply other select settings
        const selectSettings = [
            'data-retention', 'items-per-page', 'response-time', 
            'default-cancellation', 'minimum-stay'
        ];

        selectSettings.forEach(settingKey => {
            if (savedSettings[settingKey]) {
                const element = document.getElementById(settingKey);
                if (element) element.value = savedSettings[settingKey];
            }
        });
    }

    // Update currency display throughout the app
    function updateCurrencyDisplay(currency) {
        // Only update elements that already have currency symbols
        const currencyElements = document.querySelectorAll('.balance-amount, .earnings-amount');
        
        currencyElements.forEach(element => {
            if (element.textContent.includes('FCFA')) {
                element.textContent = element.textContent.replace('FCFA', currency);
            } else if (element.textContent.includes('XAF')) {
                element.textContent = element.textContent.replace('XAF', currency);
            }
        });

        // Update earnings balance specifically (the third stat card)
        const earningsBalanceElement = document.querySelector('.stat-card:nth-child(3) .stat-content h3');
        if (earningsBalanceElement) {
            const currentText = earningsBalanceElement.textContent;
            if (currentText.includes('FCFA')) {
                earningsBalanceElement.textContent = currentText.replace('FCFA', currency);
            } else if (currentText.includes('XAF')) {
                earningsBalanceElement.textContent = currentText.replace('XAF', currency);
            } else if (currentText === '0' || currentText.match(/^\d+$/)) {
                earningsBalanceElement.textContent = `${currentText} ${currency}`;
            }
        }

        // Update placeholders and labels that mention minimum amounts
        const minAmountElements = document.querySelectorAll('input[placeholder*="50,000"], .balance-note');
        minAmountElements.forEach(element => {
            if (element.tagName === 'INPUT') {
                element.placeholder = element.placeholder.replace(/FCFA|XAF/g, currency);
            } else {
                element.textContent = element.textContent.replace(/FCFA|XAF/g, currency);
            }
        });

        showNotification(`Currency updated to ${currency}`, 'success');
    }

    // Apply theme
    function applyTheme(theme) {
        const body = document.body;
        
        // Remove existing theme classes
        body.classList.remove('theme-light', 'theme-dark', 'theme-auto');
        
        if (theme === 'dark') {
            body.classList.add('theme-dark');
        } else if (theme === 'light') {
            body.classList.add('theme-light');
        } else if (theme === 'auto') {
            body.classList.add('theme-auto');
            // Apply system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                body.classList.add('theme-dark');
            } else {
                body.classList.add('theme-light');
            }
        }

        showNotification(`Theme changed to ${theme}`, 'success');
    }

    // Save all settings
    function saveAllSettings() {
        const previousSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
        const settings = {
            currency: currencySelect ? currencySelect.value : 'XAF',
            language: languageSelect ? languageSelect.value : 'en',
            theme: themeSelect ? themeSelect.value : 'light',
            timezone: document.getElementById('timezone-select')?.value || 'GMT',
            dateFormat: document.getElementById('date-format-select')?.value || 'DD/MM/YYYY',
            dataRetention: document.getElementById('data-retention')?.value || '1year',
            itemsPerPage: document.getElementById('items-per-page')?.value || '20',
            responseTime: document.getElementById('response-time')?.value || '24hours',
            defaultCancellation: document.getElementById('default-cancellation')?.value || 'moderate',
            minimumStay: document.getElementById('minimum-stay')?.value || '3',
            toggles: {}
        };
        
        // Track what changed
        const changedSettings = {};

        // Collect all toggle states
        toggleSwitches.forEach(toggle => {
            settings.toggles[toggle.id] = toggle.checked;
        });

        // Save to localStorage
        localStorage.setItem('userSettings', JSON.stringify(settings));

        // Apply immediate changes
        if (currencySelect) updateCurrencyDisplay(settings.currency);
        if (themeSelect) applyTheme(settings.theme);

        return settings;
    }

    // Reset to default settings
    function resetToDefaults() {
        if (confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
            // Clear saved settings
            localStorage.removeItem('userSettings');
            
            // Reset form elements to defaults
            if (currencySelect) currencySelect.value = 'XAF';
            if (languageSelect) languageSelect.value = 'en';
            if (themeSelect) themeSelect.value = 'light';
            
            const defaultSelections = {
                'timezone-select': 'GMT',
                'date-format-select': 'DD/MM/YYYY',
                'data-retention': '1year',
                'items-per-page': '20',
                'response-time': '24hours',
                'default-cancellation': 'moderate',
                'minimum-stay': '3'
            };

            Object.entries(defaultSelections).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.value = value;
            });

            // Reset toggles to default states
            const defaultToggles = {
                'email-notifications': true,
                'push-notifications': true,
                'sms-notifications': false,
                'marketing-notifications': false,
                'profile-visibility': true,
                'online-status': true,
                'two-factor-auth': false,
                'auto-save': true,
                'advanced-features': false,
                'allow-messages': true,
                'read-receipts': true,
                'instant-booking': false,
                'professional-mode': false
            };

            Object.entries(defaultToggles).forEach(([id, checked]) => {
                const toggle = document.getElementById(id);
                if (toggle) toggle.checked = checked;
            });

            // Apply changes
            updateCurrencyDisplay('XAF');
            applyTheme('light');

            showNotification('All settings have been reset to default values', 'success');
        }
    }

    // Handle currency change
    if (currencySelect) {
        currencySelect.addEventListener('change', (e) => {
            updateCurrencyDisplay(e.target.value);
            updateSaveButtonState(true);
        });
    }

    // Add change listeners to all settings controls
    const allSettingsControls = document.querySelectorAll('.setting-control, .toggle-switch input');
    allSettingsControls.forEach(control => {
        control.addEventListener('change', () => {
            updateSaveButtonState(true);
        });
    });

    // Handle theme change
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            applyTheme(e.target.value);
        });
    }

    // Handle language change
    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
            showNotification(`Language preference updated to ${e.target.options[e.target.selectedIndex].text}. Full language support coming soon!`, 'info');
        });
    }

    // Define features that are coming soon
    const comingSoonFeatures = {
        'two-factor-auth': 'Enhanced security with 2FA coming soon',
        'advanced-features': 'Beta features currently in development',
        'analytics-dashboard': 'Advanced analytics dashboard coming soon',
        'api-access': 'API access for developers coming soon'
    };

    // Add coming soon badges to features
    Object.entries(comingSoonFeatures).forEach(([id, message]) => {
        const element = document.getElementById(id)?.closest('.setting-item');
        if (element) {
            const badge = document.createElement('span');
            badge.className = 'coming-soon-badge';
            badge.innerHTML = '<i class="fas fa-clock"></i> Coming Soon';
            badge.title = message;
            element.querySelector('.setting-label')?.appendChild(badge);
        }
    });

    // Handle toggle changes with immediate feedback
    toggleSwitches.forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            const settingName = e.target.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const status = e.target.checked ? 'enabled' : 'disabled';
            
            // Provide specific feedback for certain settings
            if (comingSoonFeatures[e.target.id]) {
                e.target.checked = false; // Prevent enabling
                showNotification(comingSoonFeatures[e.target.id], 'info');
            } else if (e.target.id === 'professional-mode' && e.target.checked) {
                showNotification('Professional host mode activated! Advanced features are now available.', 'success');
            } else {
                showNotification(`${settingName} ${status}`, 'success');
            }
        });
    });

    // Handle specific setting changes
    const specificSettings = [
        'timezone-select', 'date-format-select', 'data-retention',
        'items-per-page', 'response-time', 'default-cancellation', 'minimum-stay'
    ];

    specificSettings.forEach(settingId => {
        const element = document.getElementById(settingId);
        if (element) {
            element.addEventListener('change', (e) => {
                const settingName = settingId.replace(/-select$/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const selectedText = e.target.options ? e.target.options[e.target.selectedIndex].text : e.target.value;
                showNotification(`${settingName} updated to: ${selectedText}`, 'info');
            });
        }
    });

    // Save settings button
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const btn = e.target;
            const originalText = btn.innerHTML;
            
            // Show loading state
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            try {
                const settings = saveAllSettings();
                // Save to backend
                await updateAdvancedSettings(settings);
                
                btn.disabled = false;
                updateSaveButtonState(false);
                btn.innerHTML = '<i class="fas fa-check"></i> Settings Saved';
                
                // Compare old and new settings to show what changed
                const changes = [];
                for (const [key, value] of Object.entries(settings)) {
                    if (key === 'toggles') continue;
                    if (JSON.stringify(value) !== JSON.stringify(previousSettings[key])) {
                        changes.push(key.replace(/([A-Z])/g, ' $1').toLowerCase());
                    }
                }

                // Check toggle changes
                const previousToggles = previousSettings.toggles || {};
                for (const [key, value] of Object.entries(settings.toggles)) {
                    if (previousToggles[key] !== value) {
                        changes.push(key.replace(/-/g, ' '));
                    }
                }

                // Show detailed success notification
                if (changes.length > 0) {
                    const changeList = changes.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ');
                    showNotification(`Updated settings: ${changeList}`, 'success');
                } else {
                    showNotification('No settings were changed', 'info');
                }

                // Reset button text after 2 seconds
                setTimeout(() => {
                    btn.innerHTML = '<i class="fas fa-save"></i> Save Settings';
                }, 2000);

                // Log settings for debugging
                console.log('Settings saved:', settings);
            } catch (error) {
                console.error('Error saving settings:', error);
                showNotification('Failed to save settings', 'error');
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }

    // Reset settings button
    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', resetToDefaults);
    }

    // Load settings on page initialization
    loadSettings();

    // Auto-save feature setup
    function setupAutoSave() {
        let autoSaveTimeout;
        const autoSaveToggle = document.getElementById('auto-save');
        const settingElements = document.querySelectorAll('.setting-control, .toggle-switch input');
        
        // Ensure auto-save is off by default
        if (autoSaveToggle) {
            autoSaveToggle.checked = false;
            
            // Add warning when enabling auto-save
            autoSaveToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    const confirmAutoSave = confirm(
                        'Warning: Auto-save will automatically save your settings as you make changes. ' +
                        'This might trigger immediate updates across the platform. ' +
                        'Are you sure you want to enable auto-save?'
                    );
                    
                    if (!confirmAutoSave) {
                        e.target.checked = false;
                        return;
                    }
                    
                    showNotification('Auto-save enabled. Settings will save automatically as you make changes.', 'info');
                } else {
                    showNotification('Auto-save disabled. Remember to save your changes manually.', 'warning');
                }
            });
        }
        
        // Add auto-save listeners to settings controls
        settingElements.forEach(element => {
            element.addEventListener('change', () => {
                const autoSaveToggle = document.getElementById('auto-save');
                if (autoSaveToggle && autoSaveToggle.checked) {
                    clearTimeout(autoSaveTimeout);
                    autoSaveTimeout = setTimeout(() => {
                        saveAllSettings();
                        showNotification('Settings auto-saved', 'info');
                    }, 2000);
                }
            });
        });
    }

    setupAutoSave();

    // Handle system theme changes for auto theme
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addListener((e) => {
            const themeSelect = document.getElementById('theme-select');
            if (themeSelect && themeSelect.value === 'auto') {
                applyTheme('auto');
            }
        });
    }
}

/*===============================================================
 * LISTING MANAGEMENT
 *===============================================================*/

// Refresh all dashboard related data
async function refreshDashboard() {
    try {
        await loadDashboardStats();
        if (document.querySelector('#my-listings-page.active')) {
            await setupMyListingsPage();
        }
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
        showNotification('Failed to refresh dashboard data', 'error');
    }
}

// Handle listing submission
async function handleListingSubmission(form, formData) {
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.innerHTML : '';

    try {
        // Update button state
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
        }

        // Send to backend
        const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/listings', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to publish listing');
        }

        const data = await response.json();
        
        // Success handling
        showNotification('Listing published successfully!', 'success');
        form.reset();

        // Refresh dashboard data
        await refreshDashboard();

        // Optional: Redirect to my listings
        showPage('my-listings');

    } catch (error) {
        console.error('Error publishing listing:', error);
        showNotification('Failed to publish listing: ' + error.message, 'error');
    } finally {
        // Restore button state
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    }
}

// Handle listing deletion
async function handleListingDeletion(listingId) {
    const listingCard = document.querySelector(`[data-listing-id="${listingId}"]`);
    const deleteButton = listingCard ? listingCard.querySelector('.btn-delete') : null;
    
    try {
        // Update button state
        if (deleteButton) {
            deleteButton.disabled = true;
            deleteButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
        }

        // Send delete request
        const response = await fetch(`https://real-estate-backend-d9es.onrender.com/api/listings/${listingId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete listing');
        }

        // Success handling
        showNotification('Listing deleted successfully', 'success');
        
        // Remove card with animation
        if (listingCard) {
            listingCard.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                listingCard.remove();
            }, 300);
        }

        // Refresh dashboard data
        await refreshDashboard();

    } catch (error) {
        console.error('Error deleting listing:', error);
        showNotification('Failed to delete listing: ' + error.message, 'error');
        
        // Restore button state
        if (deleteButton) {
            deleteButton.disabled = false;
            deleteButton.innerHTML = '<i class="fas fa-trash"></i> Delete';
        }
    }
}

function setupAddListingPage() {
    const addListingForm = document.querySelector('.add-listing-form');
    const editorContent = document.querySelector('.editor-content');
    const hiddenTextarea = document.getElementById('property-description');
    const editorButtons = document.querySelectorAll('.editor-btn');
    const saveBtn = document.querySelector('.btn-save');
    const draftBtn = document.querySelector('.btn-draft');

    console.log('Setting up add listing page'); // Debug log
    console.log('Form found:', !!addListingForm); // Debug log
    console.log('Editor content found:', !!editorContent); // Debug log
    console.log('Hidden textarea found:', !!hiddenTextarea); // Debug log
    console.log('Save button found:', !!saveBtn); // Debug log
    console.log('Editor buttons found:', editorButtons.length); // Debug log

    // Rich text editor functionality
    if (editorContent && editorButtons.length > 0) {
        // Setup editor buttons
        editorButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const command = button.getAttribute('data-command');
                
                if (command === 'bold' || command === 'italic') {
                    document.execCommand(command, false, null);
                    button.classList.toggle('active');
                } else if (command === 'insertParagraph') {
                    document.execCommand('insertHTML', false, '<p><br></p>');
                }
                
                editorContent.focus();
                updateHiddenTextarea();
            });
        });

        // Update hidden textarea when editor content changes
        editorContent.addEventListener('input', updateHiddenTextarea);
        editorContent.addEventListener('paste', () => {
            setTimeout(updateHiddenTextarea, 10);
        });

        // Update button states based on selection
        editorContent.addEventListener('selectionchange', updateButtonStates);
        document.addEventListener('selectionchange', updateButtonStates);
        
        // Initialize textarea on page load
        updateHiddenTextarea();
        
        // Test editor functionality (remove this after testing)
        if (editorContent && editorContent.textContent.trim() === '') {
            console.log('Editor is empty, testing functionality'); // Debug log
        }

        function updateHiddenTextarea() {
            if (hiddenTextarea && editorContent) {
                hiddenTextarea.value = editorContent.innerHTML.trim();
                console.log('Textarea updated:', hiddenTextarea.value); // Debug log
            }
        }

        function updateButtonStates() {
            if (document.activeElement === editorContent) {
                editorButtons.forEach(button => {
                    const command = button.getAttribute('data-command');
                    if (command === 'bold' || command === 'italic') {
                        const isActive = document.queryCommandState(command);
                        button.classList.toggle('active', isActive);
                    }
                });
            }
        }
    }

    // Form submission
    if (addListingForm) {
        // Don't clone the form as it breaks editor functionality
        // Instead, remove existing listeners by checking if already setup
        if (!addListingForm.hasAttribute('data-setup')) {
            addListingForm.setAttribute('data-setup', 'true');
            
            addListingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Form submit triggered'); // Debug log
                
                // Immediately disable button to prevent double clicks
                const saveBtn = addListingForm.querySelector('.btn-save');
                if (saveBtn && saveBtn.disabled) {
                    console.log('Button already disabled, returning'); // Debug log
                    return; // Already processing
                }
                
                console.log('Processing form submission'); // Debug log
                
                // Update hidden textarea with editor content BEFORE creating FormData
                if (editorContent && hiddenTextarea) {
                    hiddenTextarea.value = editorContent.innerHTML.trim();
                    console.log('Updated textarea with content:', hiddenTextarea.value); // Debug log
                    console.log('Editor text content:', editorContent.textContent.trim()); // Debug log
                }
                
                // Validate description - check for actual text content, not just HTML
                const textContent = editorContent ? editorContent.textContent.trim() : '';
                const htmlContent = hiddenTextarea ? hiddenTextarea.value.trim() : '';
                
                console.log('Text content length:', textContent.length); // Debug log
                console.log('HTML content length:', htmlContent.length); // Debug log
                
                if (!textContent && !htmlContent) {
                    showNotification('Please enter a property description', 'error');
                    console.log('Validation failed: No description content'); // Debug log
                    return;
                }
                
                // Check for other required fields
                const requiredFields = addListingForm.querySelectorAll('[required]');
                for (let field of requiredFields) {
                    if (!field.checkValidity()) {
                        field.focus();
                        showNotification(`Please fill in the ${field.name || field.id || 'required'} field`, 'error');
                        return;
                    }
                }
                
                // Prepare FormData
                const formData = new FormData(addListingForm);

                // Ensure images are appended with correct field name
                const imageInput = addListingForm.querySelector('input[type="file"][name="images"]');
                if (imageInput && imageInput.files.length > 0) {
                    for (const file of imageInput.files) {
                        formData.append('images', file);
                    }
                }

                // Log FormData contents for debugging
                for (let [key, value] of formData.entries()) {
                    console.log(`FormData ${key}:`, value);
                }

                // Show loading state on save button
                if (saveBtn) {
                    saveBtn.disabled = true;
                    const originalText = saveBtn.innerHTML;
                    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                    saveBtn.originalText = originalText; // Store original text
                }

                console.log('Sending request to backend'); // Debug log

                // Send data to backend using fetch
                fetch('https://real-estate-backend-d9es.onrender.com/api/listings', {
                    method: 'POST',
                    body: formData
                })
                .then(async response => {
                    console.log('Response received:', response.status); // Debug log
                    if (!response.ok) {
                        const error = await response.text();
                        throw new Error(error || 'Failed to add listing');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Listing added successfully:', data); // Debug log
                    showNotification('Listing added successfully!', 'success');
                    addListingForm.reset();
                    if (editorContent) editorContent.innerHTML = '';
                })
                .catch(error => {
                    console.error('Error adding listing:', error); // Debug log
                    showNotification('Error adding listing: ' + error.message, 'error');
                })
                .finally(() => {
                    console.log('Restoring button state'); // Debug log
                    if (saveBtn) {
                        saveBtn.disabled = false;
                        saveBtn.innerHTML = saveBtn.originalText || 'Save';
                    }
                });
            });
        }
    }

    // Save as draft functionality
    if (draftBtn && addListingForm) {
        draftBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update hidden textarea
            if (editorContent && hiddenTextarea) {
                hiddenTextarea.value = editorContent.innerHTML;
            }

            // Get form data
            const formData = new FormData(addListingForm);
            const data = Object.fromEntries(formData);
            
            // Add description from editor
            if (editorContent) {
                data['property-description'] = editorContent.innerHTML;
            }

            // Simulate saving as draft
            const originalText = draftBtn.innerHTML;
            
            draftBtn.disabled = true;
            draftBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            setTimeout(() => {
                draftBtn.disabled = false;
                draftBtn.innerHTML = originalText;
                
                // Save as draft
                const draftData = {
                    id: Date.now(),
                    ...data,
                    status: 'draft',
                    createdDate: new Date().toISOString()
                };
                
                // Store draft
                const existingDrafts = JSON.parse(localStorage.getItem('listingDrafts') || '[]');
                existingDrafts.unshift(draftData);
                localStorage.setItem('listingDrafts', JSON.stringify(existingDrafts));
                
                showNotification('Listing saved as draft!', 'success');
            }, 1000);
        });
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    setupForms();
    setupPhotoUpload();
    setupPasswordForm();
    setupVerificationPage();
    setupPayoutMethodForm();
    setupPayoutForm();
    setupWalletPage();
    setupEarningsPage();
    setupListingsPage();
    setupInvoicesPage();
    setupMessagesPage();
    setupSettingsPage();
    setupAddListingPage();
    showNotification('Welcome back, Theophilus!', 'success');
});

/*===============================================================
 * UTILITY FUNCTIONS
 *===============================================================*/

function formatCurrency(amount, currency = 'XAF') {
    return new Intl.NumberFormat('en-US').format(amount) + ' ' + currency;
}

function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(date));
}

// Profile Status Page Functions
function showProfileSection(section) {
    switch(section) {
        case 'listings':
            showPage('listings');
            showNotification('Viewing your listings', 'info');
            break;
        case 'experiences':
            showNotification('Experiences feature coming soon!', 'info');
            break;
        case 'reviews':
            showNotification('Reviews feature coming soon!', 'info');
            break;
        default:
            showNotification('Section not found', 'error');
    }
}

function navigateToHome(section) {
    // In a real application, this would navigate to the home page with a specific filter
    const sectionNames = {
        'apartments': 'Apartments',
        'single-rooms': 'Single Rooms',
        'studios': 'Studios',
        'blog': 'Blog & News'
    };
    
    const sectionName = sectionNames[section] || section;
    showNotification(`Navigating to ${sectionName} section...`, 'info');
    
    // Simulate navigation delay
    setTimeout(() => {
        showNotification(`${sectionName} section feature coming soon!`, 'info');
    }, 1000);
}

function showContactInfo() {
    const contactInfoSection = document.getElementById('contact-info');
    if (contactInfoSection) {
        if (contactInfoSection.style.display === 'none') {
            contactInfoSection.style.display = 'block';
            contactInfoSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            showNotification('Contact information displayed', 'success');
        } else {
            contactInfoSection.style.display = 'none';
            showNotification('Contact information hidden', 'info');
        }
    }
}

function openContactForm() {
    // Simulate opening a contact form
    const userConfirmed = confirm('Would you like to send us a message?\n\nClick OK to compose your message or Cancel to copy our email address.');
    
    if (userConfirmed) {
        const message = prompt('Please enter your message:');
        if (message && message.trim()) {
            showNotification('Message sent successfully! We will get back to you within 24 hours.', 'success');
        }
    } else {
        // Copy email to clipboard if available
        if (navigator.clipboard) {
            navigator.clipboard.writeText('info@roomfinder237.com').then(() => {
                showNotification('Email address copied to clipboard!', 'success');
            }).catch(() => {
                showNotification('Email: info@roomfinder237.com', 'info');
            });
        } else {
            showNotification('Email: info@roomfinder237.com', 'info');
        }
    }
}

/*===============================================================
 * PROFILE AND USER MANAGEMENT
 *===============================================================*/

// Add validation styles
const validationStyles = document.createElement('style');
validationStyles.textContent = `
    .field-error {
        color: #dc3545;
        font-size: 0.875rem;
        margin-top: 0.25rem;
        animation: fadeIn 0.3s ease;
    }

    input.error {
        border-color: #dc3545 !important;
        background-color: #fff !important;
    }

    input.error:focus {
        box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(validationStyles);

// Profile data structure
const defaultProfile = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    profilePicture: null,
    verificationStatus: 'unverified',
    payoutMethods: [],
    securityPreferences: {
        twoFactorEnabled: false,
        emailNotifications: true,
        loginAlerts: true
    }
};

// Load profile data from backend
// Profile API functions
async function loadProfileData() {
    try {
        const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load profile data');
        }

        const profileData = await response.json();
        return { ...defaultProfile, ...profileData };
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Error loading profile data', 'error');
        return defaultProfile;
    }
}

async function setup2FAAuthentication() {
    try {
        // Request 2FA setup
        const setupResponse = await fetch('https://real-estate-backend-d9es.onrender.com/api/profile/2fa/setup', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const setupData = await setupResponse.json();
        
        // Show QR code to user
        const qrCode = setupData.qr;
        showQRCode(qrCode);
        
        // Get verification code from user
        const verificationCode = await promptForVerificationCode();
        
        // Verify the code
        const verifyResponse = await fetch('https://real-estate-backend-d9es.onrender.com/api/profile/2fa/verify', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: verificationCode })
        });

        if (verifyResponse.ok) {
            showNotification('Two-factor authentication enabled successfully!', 'success');
            return true;
        } else {
            throw new Error('Invalid verification code');
        }
    } catch (error) {
        showNotification(error.message, 'error');
        return false;
    }
}

async function uploadVerificationDocuments(files) {
    try {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('documents', file);
        });

        const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/profile/verification/documents', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload documents');
        }

        const data = await response.json();
        showNotification('Documents uploaded successfully. Verification in progress.', 'success');
        return data;
    } catch (error) {
        showNotification('Error uploading documents: ' + error.message, 'error');
        throw error;
    }
}

// Real-time verification status checking
async function checkVerificationStatus() {
    try {
        const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/profile/verification/status', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();
        updateVerificationUI(data.status);
        return data;
    } catch (error) {
        console.error('Error checking verification status:', error);
        return null;
    }
}

// Update advanced settings
async function updateAdvancedSettings(settings) {
    try {
        const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/profile/settings', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });

        if (!response.ok) {
            throw new Error('Failed to update settings');
        }

        const data = await response.json();
        showNotification('Settings updated successfully', 'success');
        return data.settings;
    } catch (error) {
        showNotification('Error updating settings: ' + error.message, 'error');
        throw error;
    }
}

// Update profile data
async function updateProfileData(profileData) {
    try {
        const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/profile/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(profileData)
        });

        if (!response.ok) {
            throw new Error('Failed to update profile');
        }

        const updatedProfile = await response.json();
        showNotification('Profile updated successfully', 'success');
        return updatedProfile;
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Error updating profile', 'error');
        throw error;
    }
}

// Form validation functions
const validators = {
    phone: (value) => {
        const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
        return {
            isValid: phoneRegex.test(value),
            message: 'Please enter a valid phone number'
        };
    },
    email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
            isValid: emailRegex.test(value),
            message: 'Please enter a valid email address'
        };
    },
    address: (value) => {
        return {
            isValid: value.length >= 10,
            message: 'Address should be at least 10 characters long'
        };
    },
    name: (value) => {
        const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
        return {
            isValid: nameRegex.test(value),
            message: 'Please enter a valid name (2-50 characters, letters only)'
        };
    }
};

// Show field error message
function showFieldError(input, message) {
    let errorDiv = input.nextElementSibling;
    if (!errorDiv || !errorDiv.classList.contains('field-error')) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        input.parentNode.insertBefore(errorDiv, input.nextSibling);
    }
    errorDiv.textContent = message;
    input.classList.add('error');
}

// Clear field error message
function clearFieldError(input) {
    const errorDiv = input.nextElementSibling;
    if (errorDiv && errorDiv.classList.contains('field-error')) {
        errorDiv.remove();
    }
    input.classList.remove('error');
}

// Validate a single field
function validateField(input) {
    const value = input.value.trim();
    const validationType = input.getAttribute('data-validate');
    
    if (validationType && validators[validationType]) {
        const { isValid, message } = validators[validationType](value);
        if (!isValid) {
            showFieldError(input, message);
            return false;
        } else {
            clearFieldError(input);
            return true;
        }
    }
    return true;
}

// Setup form validation
function setupFormValidation(form) {
    const inputs = form.querySelectorAll('input[data-validate]');
    
    // Add real-time validation
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            validateField(input);
        });

        input.addEventListener('blur', () => {
            validateField(input);
        });
    });

    // Last submission timestamp for throttling
    let lastSubmissionTime = 0;
    const SUBMISSION_COOLDOWN = 2000; // 2 seconds between submissions
    
    return function validateForm() {
        // Check submission throttling
        const now = Date.now();
        if (now - lastSubmissionTime < SUBMISSION_COOLDOWN) {
            showNotification('Please wait a moment before submitting again', 'error');
            return false;
        }
        
        let isValid = true;
        inputs.forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });
        
        if (isValid) {
            lastSubmissionTime = now;
        }
        
        return isValid;
    };
}

// Profile form submission handler
async function handleProfileSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;

    // Get or create form validator
    if (!form.validateForm) {
        form.validateForm = setupFormValidation(form);
    }

    // Validate form before submission
    if (!form.validateForm()) {
        return;
    }

    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const formData = new FormData(form);
        const profileData = Object.fromEntries(formData.entries());

        await updateProfileData(profileData);
        
        // Refresh profile display
        await setupProfileStatusPage();
    } catch (error) {
        console.error('Error saving profile:', error);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
}

function setupProfileStatusPage() {
    // Load and display profile data
    loadProfileData().then(profile => {
        // Update profile form if it exists
        const profileForm = document.querySelector('.profile-form');
        if (profileForm) {
            // Fill form fields with profile data
            Object.keys(profile).forEach(key => {
                const input = profileForm.querySelector(`[name="${key}"]`);
                if (input && input.type !== 'file') {
                    input.value = profile[key];
                    
                    // Add validation attributes based on field type
                    if (key === 'email') {
                        input.setAttribute('data-validate', 'email');
                    } else if (key === 'phone') {
                        input.setAttribute('data-validate', 'phone');
                    } else if (key === 'address') {
                        input.setAttribute('data-validate', 'address');
                    } else if (key === 'firstName' || key === 'lastName') {
                        input.setAttribute('data-validate', 'name');
                    }
                }
            });

            // Add form submission handler
            profileForm.removeEventListener('submit', handleProfileSubmit);
            profileForm.addEventListener('submit', handleProfileSubmit);
        }

        // Update verification badge
        const verificationBadge = document.querySelector('.verification-badge');
        if (verificationBadge) {
            const isVerified = profile.verificationStatus === 'verified';
            verificationBadge.className = `verification-badge ${isVerified ? 'verified' : 'not-verified'}`;
            verificationBadge.innerHTML = isVerified ? 
                '<i class="fas fa-check"></i> Verified' : 
                '<i class="fas fa-clock"></i> Unverified';
        }
    });
    
    // Add hover effects for slide items
    const slideItems = document.querySelectorAll('.slide-item');
    slideItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateY(-4px) scale(1.02)';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Add click effects for links
    const profileLinks = document.querySelectorAll('.explore-link, .company-link');
    profileLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Add click animation
            link.style.transform = 'scale(0.95)';
            setTimeout(() => {
                link.style.transform = 'scale(1)';
            }, 150);
            
            // Execute the onclick function if it exists
            const onclickAttr = link.getAttribute('onclick');
            if (onclickAttr) {
                eval(onclickAttr);
            }
        });
    });
} // <-- Add this closing brace to properly end the function

// Initialize Profile Status Page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupProfileStatusPage();
    setupMyListingsPage();
});

// Setup My Listings Page
function setupMyListingsPage() {
    loadMyListings();
    
    // Setup filter buttons
    const filterButtons = document.querySelectorAll('.btn-filter');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active filter
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Filter listings
            const filter = button.getAttribute('data-filter');
            filterListings(filter);
        });
    });
    
    // Setup search functionality
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            searchListings(query);
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                searchListings(query);
            }
        });
    }
}

// Load My Listings from API
async function loadMyListings() {
    const loadingState = document.getElementById('listings-loading');
    const emptyState = document.getElementById('listings-empty');
    const listingsGrid = document.getElementById('my-listings-grid');
    
    if (!listingsGrid) return;
    
    // Show loading state
    if (loadingState) loadingState.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    listingsGrid.style.display = 'none';
    
    try {
        const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/listings');
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to load listings');
        }
        
        const listings = data.data || data || [];
        
        // Hide loading state
        if (loadingState) loadingState.style.display = 'none';
        
        if (listings.length === 0) {
            // Show empty state
            if (emptyState) emptyState.style.display = 'block';
        } else {
            // Display listings
            displayMyListings(listings);
            listingsGrid.style.display = 'grid';
        }
        
    } catch (error) {
        console.error('Error loading listings:', error);
        if (loadingState) loadingState.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.querySelector('p').textContent = 'Failed to load listings. Please try again.';
        }
        showNotification('Error loading listings: ' + error.message, 'error');
    }
}

// Display listings in the grid
function displayMyListings(listings) {
    const listingsGrid = document.getElementById('my-listings-grid');
    if (!listingsGrid) return;
    
    listingsGrid.innerHTML = '';
    
    listings.forEach(listing => {
        const listingCard = createListingCard(listing);
        listingsGrid.appendChild(listingCard);
    });
}

// Create a listing card element
function createListingCard(listing) {
    const card = document.createElement('div');
    card.className = 'listing-card';
    card.setAttribute('data-listing-id', listing._id);
    card.setAttribute('data-status', listing.status || 'published');
    
    const imageUrl = listing.images && listing.images[0] ? listing.images[0] : 'https://via.placeholder.com/320x200?text=No+Image';
    const price = listing.price ? `$${listing.price.toLocaleString()}` : 'Price not set';
    const status = listing.status || 'published';
    
    card.innerHTML = `
        <div class="listing-card-image">
            <img src="${imageUrl}" alt="${listing.title || 'Property Image'}" onerror="this.src='https://via.placeholder.com/320x200?text=No+Image'">
            <div class="listing-status-badge status-${status}">
                ${status.charAt(0).toUpperCase() + status.slice(1)}
            </div>
        </div>
        <div class="listing-card-content">
            <div class="listing-card-price">${price}</div>
            <h3 class="listing-card-title">${listing.title || 'Untitled Property'}</h3>
            <p class="listing-card-address">${listing.address || 'Address not specified'}</p>
            <div class="listing-card-specs">
                <div class="listing-spec">
                    <i class="fas fa-bed"></i>
                    <span>${listing.bedrooms || 0} bed</span>
                </div>
                <div class="listing-spec">
                    <i class="fas fa-bath"></i>
                    <span>${listing.bathrooms || 0} bath</span>
                </div>
                <div class="listing-spec">
                    <i class="fas fa-ruler-combined"></i>
                    <span>${listing.size || 0} ${listing.unitMeasure || 'sqft'}</span>
                </div>
            </div>
            <div class="listing-card-actions">
                <button class="btn-edit" onclick="editListing('${listing._id}')">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
                <button class="btn-delete" onclick="deleteListing('${listing._id}')">
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Delete listing function
async function deleteListing(listingId) {
    if (!listingId) {
        showNotification('Invalid listing ID', 'error');
        return;
    }
    
    // Store reference to the listing card early
    const listingCard = document.querySelector(`[data-listing-id="${listingId}"]`);
    
    // Confirm deletion
    const confirmed = confirm('Are you sure you want to delete this listing? This action cannot be undone.');
    if (!confirmed) return;
    
    const deleteButton = document.querySelector(`[data-listing-id="${listingId}"] .btn-delete`);
    
    try {
        // Disable button and show loading
        if (deleteButton) {
            deleteButton.disabled = true;
            deleteButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
        }
        
        const response = await fetch(`https://real-estate-backend-d9es.onrender.com/api/listings/${listingId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to delete listing');
        }
        
        // Remove the listing card from DOM
        const listingCard = document.querySelector(`[data-listing-id="${listingId}"]`);
        if (listingCard) {
            listingCard.style.transition = 'all 0.3s ease';
            listingCard.style.transform = 'scale(0)';
            listingCard.style.opacity = '0';
            
            setTimeout(() => {
                listingCard.remove();
                
                // Check if any listings remain
                const remainingListings = document.querySelectorAll('.listing-card');
                if (remainingListings.length === 0) {
                    const emptyState = document.getElementById('listings-empty');
                    const listingsGrid = document.getElementById('my-listings-grid');
                    if (emptyState) emptyState.style.display = 'block';
                    if (listingsGrid) listingsGrid.style.display = 'none';
                }
            }, 300);
        }
        
        showNotification('Listing deleted successfully!', 'success');
        
    } catch (error) {
        console.error('Error deleting listing:', error);
        showNotification('Error deleting listing: ' + error.message, 'error');
        
        // Re-enable button
        if (deleteButton) {
            deleteButton.disabled = false;
            deleteButton.innerHTML = '<i class="fas fa-trash"></i> Delete';
        }
    }
}

// Edit listing function (placeholder)
function editListing(listingId) {
    showNotification('Edit functionality coming soon!', 'info');
    // TODO: Implement edit functionality
    // This could navigate to the add-listing page with pre-filled data
}

// Filter listings by status
function filterListings(filter) {
    const listingCards = document.querySelectorAll('.listing-card');
    
    listingCards.forEach(card => {
        const status = card.getAttribute('data-status');
        
        if (filter === 'all' || status === filter) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Search listings by title or address
function searchListings(query) {
    const listingCards = document.querySelectorAll('.listing-card');
    
    if (!query) {
        // Show all listings if no query
        listingCards.forEach(card => {
            card.style.display = 'block';
        });
        return;
    }
    
    const searchTerm = query.toLowerCase();
    
    listingCards.forEach(card => {
        const title = card.querySelector('.listing-card-title').textContent.toLowerCase();
        const address = card.querySelector('.listing-card-address').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || address.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Booking System Functions
let currentBookings = [];

// Initialize booking system
async function initializeBookingSystem() {
    await loadBookingStats();
    loadBookings();
    setupBookingFilters();
}

// Load booking statistics
async function loadBookingStats() {
    try {
        const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/bookings/stats');
        const stats = await response.json();
        
        document.getElementById('total-bookings').textContent = stats.total || 0;
        document.getElementById('active-bookings').textContent = stats.active || 0;
        document.getElementById('completed-bookings').textContent = stats.completed || 0;
    } catch (error) {
        console.error('Error loading booking stats:', error);
        showNotification('Failed to load booking statistics', 'error');
    }
}

// Load bookings
async function loadBookings(filter = 'all') {
    const loadingState = document.getElementById('bookings-loading');
    const emptyState = document.getElementById('bookings-empty');
    const bookingsGrid = document.getElementById('bookings-grid');

    try {
        loadingState.style.display = 'flex';
        emptyState.style.display = 'none';
        bookingsGrid.style.display = 'none';

        const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/bookings');
        const bookings = await response.json();

        currentBookings = bookings;
        displayBookings(filter);

    } catch (error) {
        console.error('Error loading bookings:', error);
        showNotification('Failed to load bookings', 'error');
    } finally {
        loadingState.style.display = 'none';
    }
}

// Display bookings
function displayBookings(filter = 'all') {
    const bookingsGrid = document.getElementById('bookings-grid');
    const emptyState = document.getElementById('bookings-empty');

    let filteredBookings = currentBookings;
    if (filter !== 'all') {
        filteredBookings = currentBookings.filter(booking => booking.status === filter);
    }

    if (filteredBookings.length === 0) {
        emptyState.style.display = 'flex';
        bookingsGrid.style.display = 'none';
        return;
    }

    bookingsGrid.style.display = 'grid';
    emptyState.style.display = 'none';

    bookingsGrid.innerHTML = filteredBookings.map(booking => `
        <div class="booking-card" data-id="${booking._id}">
            <div class="booking-header">
                <div class="booking-status ${booking.status}">${booking.status}</div>
                <div class="booking-date">${formatDate(booking.createdAt)}</div>
            </div>
            <div class="booking-body">
                <h3 class="property-title">${booking.propertyId.title}</h3>
                <div class="booking-info">
                    <p><i class="fas fa-user"></i> ${booking.clientName}</p>
                    <p><i class="fas fa-envelope"></i> ${booking.clientEmail}</p>
                    <p><i class="fas fa-phone"></i> ${booking.clientPhone}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// Setup booking filters
function setupBookingFilters() {
    const filterButtons = document.querySelectorAll('.btn-filter');
    const searchInput = document.querySelector('.search-input');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const filter = button.dataset.filter;
            displayBookings(filter);
        });
    });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredBookings = currentBookings.filter(booking => 
            booking.clientName.toLowerCase().includes(searchTerm) ||
            booking.clientEmail.toLowerCase().includes(searchTerm) ||
            booking.propertyId.title.toLowerCase().includes(searchTerm)
        );
        displayFilteredBookings(filteredBookings);
    });
}

// Display filtered bookings
function displayFilteredBookings(filteredBookings) {
    const bookingsGrid = document.getElementById('bookings-grid');
    const emptyState = document.getElementById('bookings-empty');

    if (filteredBookings.length === 0) {
        emptyState.style.display = 'flex';
        bookingsGrid.style.display = 'none';
        return;
    }

    bookingsGrid.style.display = 'grid';
    emptyState.style.display = 'none';

    bookingsGrid.innerHTML = filteredBookings.map(booking => `
        <div class="booking-card" data-id="${booking._id}">
            <div class="booking-header">
                <div class="booking-status ${booking.status}">${booking.status}</div>
                <div class="booking-date">${formatDate(booking.createdAt)}</div>
            </div>
            <div class="booking-body">
                <h3 class="property-title">${booking.propertyId.title}</h3>
                <div class="booking-info">
                    <p><i class="fas fa-user"></i> ${booking.clientName}</p>
                    <p><i class="fas fa-envelope"></i> ${booking.clientEmail}</p>
                    <p><i class="fas fa-phone"></i> ${booking.clientPhone}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// Set up calendar view
function setupCalendarView() {
    const calendar = document.querySelector('.calendar-grid');
    updateCalendar(selectedDate);
    
    document.getElementById('prev-month').addEventListener('click', () => {
        selectedDate.setMonth(selectedDate.getMonth() - 1);
        updateCalendar(selectedDate);
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
        selectedDate.setMonth(selectedDate.getMonth() + 1);
        updateCalendar(selectedDate);
    });
}

// Update calendar with bookings
async function updateCalendar(date) {
    const calendar = document.querySelector('.calendar-grid');
    calendar.innerHTML = '';
    
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    document.getElementById('calendar-month').textContent = 
        new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
    
    // Add empty cells for days before first of month
    for (let i = 0; i < firstDay.getDay(); i++) {
        calendar.appendChild(createCalendarDay());
    }
    
    // Add days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const currentDate = new Date(year, month, day);
        const dayCell = createCalendarDay(currentDate);
        calendar.appendChild(dayCell);
    }
    
    // Load and display bookings
    await loadBookingsForMonth(year, month);
}

// Create a calendar day cell
function createCalendarDay(date) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    
    if (date) {
        cell.textContent = date.getDate();
        if (isSameDay(date, new Date())) {
            cell.classList.add('today');
        }
        
        cell.addEventListener('click', () => showBookingsForDate(date));
    }
    
    return cell;
}

// Load bookings for selected month
async function loadBookingsForMonth(year, month) {
    try {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        
        const response = await fetch(
            `https://real-estate-backend-d9es.onrender.com/api/bookings/agent-bookings?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );
        
        currentBookings = await response.json();
        markBookedDays();
        updateListView();
    } catch (error) {
        console.error('Error loading bookings:', error);
        showNotification('Failed to load bookings', 'error');
    }
}

// Mark days with bookings on calendar
function markBookedDays() {
    const days = document.querySelectorAll('.calendar-day');
    days.forEach(day => {
        const dateText = day.textContent;
        if (dateText) {
            const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), parseInt(dateText));
            const hasBookings = currentBookings.some(booking => 
                isSameDay(new Date(booking.viewingDate), date)
            );
            if (hasBookings) {
                day.classList.add('has-bookings');
            }
        }
    });
}

// Set up list view
function setupListView() {
    const statusFilter = document.getElementById('status-filter');
    const dateFilter = document.getElementById('date-filter');
    
    statusFilter.addEventListener('change', updateListView);
    dateFilter.addEventListener('change', updateListView);
    
    updateListView();
}

// Update list view with filtered bookings
function updateListView() {
    const listContainer = document.querySelector('.bookings-list');
    const statusFilter = document.getElementById('status-filter').value;
    const dateFilter = document.getElementById('date-filter').value;
    
    let filteredBookings = [...currentBookings];
    
    if (statusFilter !== 'all') {
        filteredBookings = filteredBookings.filter(booking => booking.status === statusFilter);
    }
    
    if (dateFilter) {
        filteredBookings = filteredBookings.filter(booking => 
            isSameDay(new Date(booking.viewingDate), new Date(dateFilter))
        );
    }
    
    listContainer.innerHTML = filteredBookings.length ? 
        filteredBookings.map(booking => createBookingListItem(booking)).join('') :
        '<div class="empty-state"><i class="fas fa-calendar-check empty-icon"></i><p>No bookings found</p></div>';
}

// Create booking list item HTML
function createBookingListItem(booking) {
    return `
        <div class="booking-item" data-id="${booking._id}">
            <div class="booking-time">
                <div class="date">${formatDate(booking.viewingDate)}</div>
                <div class="time">${formatTime(booking.viewingDate)}</div>
            </div>
            <div class="booking-info">
                <h4>${booking.clientName}</h4>
                <p>${booking.propertyId.title}</p>
                <p class="status ${booking.status}">${booking.status}</p>
            </div>
            <div class="booking-actions">
                ${createBookingActions(booking)}
            </div>
        </div>
    `;
}

// Create booking action buttons based on status
function createBookingActions(booking) {
    const actions = [];
    
    switch(booking.status) {
        case 'pending':
            actions.push(
                `<button class="btn btn-success" onclick="updateBookingStatus('${booking._id}', 'confirmed')">
                    <i class="fas fa-check"></i> Confirm
                </button>`,
                `<button class="btn btn-danger" onclick="updateBookingStatus('${booking._id}', 'cancelled')">
                    <i class="fas fa-times"></i> Cancel
                </button>`
            );
            break;
        case 'confirmed':
            actions.push(
                `<button class="btn btn-primary" onclick="updateBookingStatus('${booking._id}', 'completed')">
                    <i class="fas fa-check-double"></i> Complete
                </button>`,
                `<button class="btn btn-danger" onclick="updateBookingStatus('${booking._id}', 'cancelled')">
                    <i class="fas fa-times"></i> Cancel
                </button>`
            );
            break;
    }
    
    return actions.join('');
}

// Update booking status
async function updateBookingStatus(bookingId, newStatus) {
    try {
        const response = await fetch(`https://real-estate-backend-d9es.onrender.com/api/bookings/${bookingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) throw new Error('Failed to update booking');
        
        await loadBookingsForMonth(selectedDate.getFullYear(), selectedDate.getMonth());
        showNotification('Booking updated successfully', 'success');
    } catch (error) {
        console.error('Error updating booking:', error);
        showNotification('Failed to update booking', 'error');
    }
}

// Load user's properties for booking form
async function loadMyProperties() {
    try {
        const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/listings/my-listings');
        const properties = await response.json();
        
        const select = document.querySelector('select[name="propertyId"]');
        select.innerHTML = properties.map(property => 
            `<option value="${property._id}">${property.title}</option>`
        ).join('');
    } catch (error) {
        console.error('Error loading properties:', error);
        showNotification('Failed to load properties', 'error');
    }
}

// Handle new booking form submission
async function handleNewBooking(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    // Combine date and time
    const date = formData.get('viewingDate');
    const time = formData.get('viewingTime');
    let viewingDate;
    
    if (date && time) {
        viewingDate = new Date(`${date}T${time}`);
    } else {
        showNotification('Please provide both date and time', 'error');
        return; // Exit the function if date or time is missing
    }
    
    try {
        const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                propertyId: formData.get('propertyId'),
                clientName: formData.get('clientName'),
                clientEmail: formData.get('clientEmail'),
                clientPhone: formData.get('clientPhone'),
                viewingDate: viewingDate.toISOString(),
                duration: parseInt(formData.get('duration')),
                notes: formData.get('notes')
            })
        });
        
        if (!response.ok) throw new Error('Failed to create booking');
        
        closeModal('booking-modal');
        await loadBookingsForMonth(selectedDate.getFullYear(), selectedDate.getMonth());
        showNotification('Booking created successfully', 'success');
    } catch (error) {
        console.error('Error creating booking:', error);
        showNotification('Failed to create booking', 'error');
    }
}

// Utility functions
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Set up event listeners for booking system
function setupEventListeners() {
    // View toggle
    document.querySelectorAll('.btn-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const view = btn.dataset.view;
            document.querySelector('.calendar-view').style.display = view === 'calendar' ? 'block' : 'none';
            document.querySelector('.list-view').style.display = view === 'list' ? 'block' : 'none';
        });
    });
    
    // New booking button
    document.getElementById('new-booking-btn').addEventListener('click', () => {
        document.getElementById('booking-modal').classList.add('show');
    });
    
    // Close modal button
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('booking-modal').classList.remove('show');
    });
    
    // Booking form submission
    document.getElementById('booking-form').addEventListener('submit', handleNewBooking);
}

// Initialize booking system when bookings page is shown
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('bookings-page')) {
        initializeBookingSystem();
    }
});

// Booking Notification System
const notificationSystem = {
    lastNotificationTime: 0,

    initialize() {
        // Use the existing socketConnection
        const socket = socketConnection.getSocket();
        if (!socket) {
            socketConnection.setupConnection();
        }

        // Setup booking notifications
        this.setupBookingNotifications();
    },

    setupBookingNotifications() {
        const socket = socketConnection.getSocket();
        if (!socket) return;

        socket.on('newBooking', (booking) => {
            if (booking.agentId === this.getCurrentAgentId()) {
                this.showBookingNotification(booking);
                this.updateBookingStats();
                this.addNotificationToList(booking);
            }
        });
    },

    showBookingNotification(booking) {
        const now = Date.now();
        if (now - this.lastNotificationTime < 2000) return;
        
        this.lastNotificationTime = now;
        
        showNotification({
            title: `New Booking: ${booking.propertyTitle}`,
            message: `From: ${booking.clientName}`,
            type: 'info'
        });

        this.playNotificationSound();
    },

    addNotificationToList(booking) {
        const notificationsList = document.getElementById('notifications-list');
        const emptyNotifications = document.getElementById('empty-notifications');
        
        if (emptyNotifications) {
            emptyNotifications.style.display = 'none';
        }

        const notificationElement = document.createElement('div');
        notificationElement.className = 'notification-item new';
        notificationElement.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-home"></i>
            </div>
            <div class="notification-content">
                <h4>${booking.propertyTitle}</h4>
                <p>New booking from ${booking.clientName}</p>
                <small>${formatDate(new Date())}</small>
            </div>
        `;

        notificationsList.insertBefore(notificationElement, notificationsList.firstChild);

        const newBookingsCount = document.getElementById('new-bookings');
        if (newBookingsCount) {
            newBookingsCount.textContent = parseInt(newBookingsCount.textContent || 0) + 1;
        }
    },

    playNotificationSound() {
        const audio = new Audio('/notification-sound.mp3');
        audio.play().catch(error => console.log('Error playing notification sound:', error));
    },

    getCurrentAgentId() {
        const user = JSON.parse(localStorage.getItem('user'));
        return user ? user._id : null;
    },

    async updateBookingStats() {
        try {
            const response = await fetch('https://real-estate-backend-d9es.onrender.com/api/bookings/stats');
            const stats = await response.json();
            
            const elements = {
                total: document.getElementById('total-bookings'),
                active: document.getElementById('active-bookings'),
                completed: document.getElementById('completed-bookings')
            };

            if (elements.total) elements.total.textContent = stats.total || 0;
            if (elements.active) elements.active.textContent = stats.active || 0;
            if (elements.completed) elements.completed.textContent = stats.completed || 0;
        } catch (error) {
            console.error('Error updating booking stats:', error);
        }
    }
};

function playNotificationSound() {
    const audio = new Audio('/notification-sound.mp3');
    audio.play().catch(error => console.log('Error playing notification sound:', error));
}

// Get current agent ID from localStorage or session
function getCurrentAgentId() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user ? user._id : null;
}

// Initialize the notification system when the bookings page is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('bookings-page')) {
        notificationSystem.initialize();
    }
});

// Export functions for potential module usage
window.CribzConnect = {
    showPage,
    showNotification,
    formatCurrency,
    formatDate,
    showProfileSection,
    navigateToHome,
    showContactInfo,
    openContactForm,
    updateBookingStatus,
    initializeBookingNotifications
};


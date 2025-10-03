// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.currentTab = 'dashboard';
        this.currentUser = JSON.parse(localStorage.getItem('adminUser')) || null;
        this.charts = {};
        this.data = this.initializeMockData();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupMobileMenu();
        this.initializeCharts();
        this.populateInitialData();
        this.startRealTimeUpdates();
    }

    // Initialize mock data for demonstration
    initializeMockData() {
        return {
            stats: {
                totalProperties: 2847,
                totalUsers: 8452,
                totalRevenue: 247580,
                verifiedAgents: 156
            },
            agents: [
                {
                    id: 1,
                    name: 'Sarah Johnson',
                    email: 'sarah@example.com',
                    phone: '+234-801-234-5678',
                    status: 'verified',
                    listings: 24,
                    joinDate: '2024-01-15',
                    initials: 'SJ'
                },
                {
                    id: 2,
                    name: 'Michael Chen',
                    email: 'michael@example.com',
                    phone: '+234-802-345-6789',
                    status: 'pending',
                    listings: 12,
                    joinDate: '2024-02-20',
                    initials: 'MC'
                },
                {
                    id: 3,
                    name: 'David Wilson',
                    email: 'david@example.com',
                    phone: '+234-803-456-7890',
                    status: 'verified',
                    listings: 18,
                    joinDate: '2024-01-10',
                    initials: 'DW'
                }
            ],
            clients: [
                {
                    id: 1,
                    name: 'Emma Thompson',
                    email: 'emma@example.com',
                    bookings: 3,
                    disputes: 0,
                    status: 'active',
                    joinDate: '2024-03-01'
                },
                {
                    id: 2,
                    name: 'John Smith',
                    email: 'john@example.com',
                    bookings: 1,
                    disputes: 1,
                    status: 'active',
                    joinDate: '2024-02-15'
                }
            ],
            properties: [
                {
                    id: 1,
                    title: 'Modern 2BR Apartment in Victoria Island',
                    agent: 'Sarah Johnson',
                    price: 450000,
                    status: 'approved',
                    dateList: '2024-08-15',
                    location: 'lagos',
                    type: 'apartment'
                },
                {
                    id: 2,
                    title: 'Executive Studio in Lekki',
                    agent: 'Michael Chen',
                    price: 280000,
                    status: 'pending',
                    dateList: '2024-08-18',
                    location: 'lagos',
                    type: 'studio'
                },
                {
                    id: 3,
                    title: '4BR Duplex in Abuja',
                    agent: 'David Wilson',
                    price: 650000,
                    status: 'approved',
                    dateList: '2024-08-10',
                    location: 'abuja',
                    type: 'house'
                }
            ],
            transactions: [
                {
                    id: 'BK001',
                    tenant: 'Emma Thompson',
                    agent: 'Sarah Johnson',
                    property: 'Modern 2BR Apartment',
                    amount: 450000,
                    date: '2024-08-15',
                    status: 'completed'
                },
                {
                    id: 'BK002',
                    tenant: 'John Smith',
                    agent: 'Michael Chen',
                    property: 'Executive Studio',
                    amount: 280000,
                    date: '2024-08-18',
                    status: 'pending'
                }
            ],
            disputes: [
                {
                    id: 1,
                    title: 'Property Condition Issue',
                    tenant: 'John Smith',
                    agent: 'Michael Chen',
                    property: 'Executive Studio in Lekki',
                    priority: 'high',
                    description: 'The property was not in the condition as advertised. Several appliances are not working properly.',
                    date: '2024-08-17',
                    status: 'open'
                },
                {
                    id: 2,
                    title: 'Refund Request Delay',
                    tenant: 'Lisa Anderson',
                    agent: 'Sarah Johnson',
                    property: 'Modern 2BR Apartment',
                    priority: 'medium',
                    description: 'Security deposit refund has been delayed for over 30 days without proper justification.',
                    date: '2024-08-16',
                    status: 'open'
                }
            ]
        };
    }

    setupEventListeners() {
        // Sidebar navigation
        document.addEventListener('click', (e) => {
            // Menu item clicks
            if (e.target.closest('.menu-item')) {
                const menuItem = e.target.closest('.menu-item');
                const tab = menuItem.dataset.tab;
                
                if (tab) {
                    this.switchTab(tab);
                }
                
                // Handle submenu expansion
                if (menuItem.querySelector('.submenu')) {
                    menuItem.classList.toggle('expanded');
                }
            }
            
            // Submenu item clicks
            if (e.target.classList.contains('submenu-item')) {
                const tab = e.target.dataset.tab;
                if (tab) {
                    this.switchTab(tab);
                }
            }
        });

        // Filter change events
        document.addEventListener('change', (e) => {
            if (e.target.id.includes('Filter')) {
                this.applyFilters();
            }
        });

        // Search functionality
        const searchInput = document.querySelector('.search-container input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.performSearch(e.target.value);
            });
        }

        // Window resize handling
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    switchTab(tabName) {
        // Update current tab
        this.currentTab = tabName;
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab
        const targetTab = document.getElementById(tabName);
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // Update sidebar active states
        document.querySelectorAll('.menu-item, .submenu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Find and activate the correct menu item
        const menuItem = document.querySelector(`[data-tab="${tabName}"]`);
        if (menuItem) {
            menuItem.classList.add('active');
            
            // If it's a submenu item, also expand the parent
            const parentMenu = menuItem.closest('.menu-item');
            if (parentMenu && parentMenu !== menuItem) {
                parentMenu.classList.add('expanded');
            }
        }
        
        // Load tab-specific data
        this.loadTabData(tabName);
    }

    loadTabData(tabName) {
        switch(tabName) {
            case 'dashboard':
                this.updateDashboardStats();
                this.updateLeaderboard();
                break;
            case 'agents':
                this.populateAgentsTable();
                break;
            case 'clients':
                this.populateClientsTable();
                break;
            case 'all-properties':
                this.populatePropertiesTable();
                break;
            case 'pending-approvals':
                this.populatePendingApprovals();
                break;
            case 'transaction-history':
                this.populateTransactionsTable();
                break;
            case 'open-disputes':
                this.populateDisputes();
                break;
        }
    }

    initializeCharts() {
        // Rentals per Month Chart
        const rentalsCtx = document.getElementById('rentalsChart');
        if (rentalsCtx) {
            this.charts.rentals = new Chart(rentalsCtx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                    datasets: [{
                        label: 'Rentals',
                        data: [65, 89, 123, 145, 167, 189, 201, 234],
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }

        // Property Type Breakdown Chart
        const propertyTypeCtx = document.getElementById('propertyTypeChart');
        if (propertyTypeCtx) {
            this.charts.propertyType = new Chart(propertyTypeCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Apartments', 'Houses', 'Studios', 'Condos'],
                    datasets: [{
                        data: [45, 25, 20, 10],
                        backgroundColor: [
                            '#3b82f6',
                            '#10b981',
                            '#f59e0b',
                            '#ef4444'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        }
                    }
                }
            });
        }
    }

    populateInitialData() {
        this.updateDashboardStats();
        this.populateAgentsTable();
        this.populateClientsTable();
        this.populatePropertiesTable();
        this.populateTransactionsTable();
        this.populatePendingApprovals();
        this.populateDisputes();
        this.updateLeaderboard();
    }

    updateDashboardStats() {
        // Update stat cards with current data
        const statCards = document.querySelectorAll('.stat-info h3');
        if (statCards.length >= 4) {
            statCards[0].textContent = this.formatNumber(this.data.stats.totalProperties);
            statCards[1].textContent = this.formatNumber(this.data.stats.totalUsers);
            statCards[2].textContent = '$' + this.formatNumber(this.data.stats.totalRevenue);
            statCards[3].textContent = this.formatNumber(this.data.stats.verifiedAgents);
        }
    }

    updateLeaderboard() {
        const leaderboardContainer = document.querySelector('.leaderboard-list');
        if (!leaderboardContainer) return;

        // Sort agents by performance and take top 5
        const topAgents = [...this.data.agents]
            .sort((a, b) => b.listings - a.listings)
            .slice(0, 5);

        leaderboardContainer.innerHTML = topAgents.map(agent => `
            <div class="leaderboard-item">
                <div class="agent-info">
                    <div class="profile-avatar" data-name="${agent.name}">${agent.initials}</div>
                    <div>
                        <h4>${agent.name}</h4>
                        <p>${agent.status === 'verified' ? 'Verified Agent' : 'Pending Verification'}</p>
                    </div>
                </div>
                <div class="agent-stats">
                    <span class="listings">${agent.listings} Properties</span>
                    <span class="revenue">XAF ${(agent.listings * 15000).toLocaleString()}</span>
                </div>
            </div>
        `).join('');
    }

    populateAgentsTable() {
        const tbody = document.getElementById('agentsTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.data.agents.map(agent => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div class="profile-avatar" data-name="${agent.name}" style="width: 35px; height: 35px; font-size: 0.8rem;">${agent.initials}</div>
                        <div>
                            <strong>${agent.name}</strong>
                            <br><small style="color: var(--gray-500);">Agent ID: #${agent.id}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div>${agent.email}</div>
                    <small style="color: var(--gray-500);">${agent.phone}</small>
                </td>
                <td>
                    <span class="status-badge ${agent.status}">
                        ${agent.status === 'verified' ? 'Verified' : 'Pending'}
                    </span>
                </td>
                <td><strong>${agent.listings}</strong> active</td>
                <td>${this.formatDate(agent.joinDate)}</td>
                <td>
                    <div class="table-actions">
                        ${agent.status === 'pending' ? 
                            `<button class="action-btn-sm btn-approve" onclick="adminDashboard.approveAgent(${agent.id})">Approve</button>` :
                            `<button class="action-btn-sm btn-suspend" onclick="adminDashboard.suspendAgent(${agent.id})">Suspend</button>`
                        }
                        <button class="action-btn-sm btn-edit" onclick="adminDashboard.editAgent(${agent.id})">Edit</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    populateClientsTable() {
        const tbody = document.getElementById('clientsTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.data.clients.map(client => `
            <tr>
                <td>
                    <div>
                        <strong>${client.name}</strong>
                        <br><small style="color: var(--gray-500);">Client ID: #${client.id}</small>
                    </div>
                </td>
                <td>${client.email}</td>
                <td><strong>${client.bookings}</strong> bookings</td>
                <td>
                    ${client.disputes > 0 ? 
                        `<span style="color: var(--danger-color); font-weight: 500;">${client.disputes} disputes</span>` :
                        `<span style="color: var(--success-color);">No disputes</span>`
                    }
                </td>
                <td>
                    <span class="status-badge ${client.status}">
                        ${client.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        ${client.status === 'active' ?
                            `<button class="action-btn-sm btn-suspend" onclick="adminDashboard.suspendClient(${client.id})">Suspend</button>` :
                            `<button class="action-btn-sm btn-approve" onclick="adminDashboard.activateClient(${client.id})">Activate</button>`
                        }
                        <button class="action-btn-sm btn-edit" onclick="adminDashboard.editClient(${client.id})">Edit</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    populatePropertiesTable() {
        const tbody = document.getElementById('propertiesTableBody');
        if (!tbody) return;

        let filteredProperties = this.applyPropertyFilters();

        tbody.innerHTML = filteredProperties.map(property => `
            <tr>
                <td>
                    <div>
                        <strong>${property.title}</strong>
                        <br><small style="color: var(--gray-500);">${property.location.charAt(0).toUpperCase() + property.location.slice(1)} • ${property.type}</small>
                    </div>
                </td>
                <td>${property.agent}</td>
                <td><strong>XAF${property.price.toLocaleString()}</strong></td>
                <td>
                    <span class="status-badge ${property.status}">
                        ${property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                    </span>
                </td>
                <td>${this.formatDate(property.dateList)}</td>
                <td>
                    <div class="table-actions">
                        ${property.status === 'pending' ? 
                            `<button class="action-btn-sm btn-approve" onclick="adminDashboard.approveProperty(${property.id})">Approve</button>
                             <button class="action-btn-sm btn-reject" onclick="adminDashboard.rejectProperty(${property.id})">Reject</button>` :
                            `<button class="action-btn-sm btn-edit" onclick="adminDashboard.editProperty(${property.id})">Edit</button>`
                        }
                    </div>
                </td>
            </tr>
        `).join('');
    }

    populatePendingApprovals() {
        const container = document.getElementById('pendingPropertiesGrid');
        if (!container) return;

        const pendingProperties = this.data.properties.filter(p => p.status === 'pending');

        container.innerHTML = pendingProperties.map(property => `
            <div class="pending-property-card">
                <div class="property-image" style="background-image: url('https://via.placeholder.com/350x200')"></div>
                <div class="property-details">
                    <h4>${property.title}</h4>
                    <p>A modern property in a prime location with excellent amenities and facilities.</p>
                    <div class="property-meta">
                        <div class="property-price">XAF${property.price.toLocaleString()}/month</div>
                        <div class="property-agent">by ${property.agent}</div>
                    </div>
                    <div class="property-actions">
                        <button class="action-btn-sm btn-approve" onclick="adminDashboard.approveProperty(${property.id})">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="action-btn-sm btn-reject" onclick="adminDashboard.rejectProperty(${property.id})">
                            <i class="fas fa-times"></i> Reject
                        </button>
                        <button class="action-btn-sm btn-edit" onclick="adminDashboard.viewPropertyDetails(${property.id})">
                            <i class="fas fa-eye"></i> Details
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    populateTransactionsTable() {
        const tbody = document.getElementById('transactionsTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.data.transactions.map(transaction => `
            <tr>
                <td><strong>${transaction.id}</strong></td>
                <td>${transaction.tenant}</td>
                <td>${transaction.agent}</td>
                <td>${transaction.property}</td>
                <td><strong>XAF ${transaction.amount.toLocaleString()}</strong></td>
                <td>${this.formatDate(transaction.date)}</td>
                <td>
                    <span class="status-badge ${transaction.status}">
                        ${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn-sm btn-edit" onclick="adminDashboard.viewTransaction('${transaction.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    populateDisputes() {
        const container = document.getElementById('disputesContainer');
        if (!container) return;

        const openDisputes = this.data.disputes.filter(d => d.status === 'open');

        container.innerHTML = openDisputes.map(dispute => `
            <div class="dispute-card">
                <div class="dispute-header">
                    <div class="dispute-info">
                        <h4>${dispute.title}</h4>
                        <p><strong>Tenant:</strong> ${dispute.tenant} vs <strong>Agent:</strong> ${dispute.agent}</p>
                        <p><strong>Property:</strong> ${dispute.property}</p>
                        <p><strong>Date:</strong> ${this.formatDate(dispute.date)}</p>
                    </div>
                    <span class="dispute-priority priority-${dispute.priority}">
                        ${dispute.priority.toUpperCase()} PRIORITY
                    </span>
                </div>
                <div class="dispute-description">
                    ${dispute.description}
                </div>
                <div class="dispute-actions">
                    <button class="action-btn-sm btn-approve" onclick="adminDashboard.resolveDispute(${dispute.id}, 'resolved')">
                        <i class="fas fa-check"></i> Mark Resolved
                    </button>
                    <button class="action-btn-sm btn-edit" onclick="adminDashboard.investigateDispute(${dispute.id})">
                        <i class="fas fa-search"></i> Investigate
                    </button>
                    <button class="action-btn-sm btn-reject" onclick="adminDashboard.escalateDispute(${dispute.id})">
                        <i class="fas fa-exclamation-triangle"></i> Escalate
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Filter Functions
    applyPropertyFilters() {
        let filtered = [...this.data.properties];

        const locationFilter = document.getElementById('propertyLocationFilter')?.value;
        const typeFilter = document.getElementById('propertyTypeFilter')?.value;
        const statusFilter = document.getElementById('propertyStatusFilter')?.value;

        if (locationFilter && locationFilter !== 'all') {
            filtered = filtered.filter(p => p.location === locationFilter);
        }

        if (typeFilter && typeFilter !== 'all') {
            filtered = filtered.filter(p => p.type === typeFilter);
        }

        if (statusFilter && statusFilter !== 'all') {
            filtered = filtered.filter(p => p.status === statusFilter);
        }

        return filtered;
    }

    applyFilters() {
        // Re-populate tables with filtered data
        if (this.currentTab === 'all-properties') {
            this.populatePropertiesTable();
        }
    }

    // Action Functions
    approveAgent(agentId) {
        const agent = this.data.agents.find(a => a.id === agentId);
        if (agent) {
            agent.status = 'verified';
            this.populateAgentsTable();
            this.showMessage('success', `Agent ${agent.name} has been approved and verified.`);
        }
    }

    suspendAgent(agentId) {
        const agent = this.data.agents.find(a => a.id === agentId);
        if (agent && confirm(`Are you sure you want to suspend ${agent.name}?`)) {
            agent.status = 'suspended';
            this.populateAgentsTable();
            this.showMessage('success', `Agent ${agent.name} has been suspended.`);
        }
    }

    editAgent(agentId) {
        this.showMessage('info', 'Agent edit functionality would open a detailed form here.');
    }

    approveProperty(propertyId) {
        const property = this.data.properties.find(p => p.id === propertyId);
        if (property) {
            property.status = 'approved';
            this.populatePropertiesTable();
            this.populatePendingApprovals();
            this.showMessage('success', `Property "${property.title}" has been approved.`);
        }
    }

    rejectProperty(propertyId) {
        const property = this.data.properties.find(p => p.id === propertyId);
        if (property) {
            const reason = prompt('Please provide a reason for rejection:');
            if (reason) {
                property.status = 'rejected';
                property.rejectionReason = reason;
                this.populatePropertiesTable();
                this.populatePendingApprovals();
                this.showMessage('success', `Property "${property.title}" has been rejected.`);
            }
        }
    }

    resolveDispute(disputeId, resolution) {
        const dispute = this.data.disputes.find(d => d.id === disputeId);
        if (dispute) {
            dispute.status = resolution;
            dispute.resolvedDate = new Date().toISOString().split('T')[0];
            this.populateDisputes();
            this.showMessage('success', `Dispute "${dispute.title}" has been marked as ${resolution}.`);
        }
    }

    // Modal Functions
    showAnnouncementModal() {
        const modal = document.getElementById('announcementModal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    }

    sendAnnouncement() {
        const subject = document.getElementById('announcementSubject')?.value;
        const message = document.getElementById('announcementMessage')?.value;
        const recipients = Array.from(document.querySelectorAll('#announcementModal input[type="checkbox"]:checked'))
            .map(cb => cb.value);

        if (subject && message && recipients.length > 0) {
            // Simulate sending announcement
            this.showMessage('success', `Announcement sent to ${recipients.join(', ')}.`);
            this.closeModal('announcementModal');
            
            // Clear form
            document.getElementById('announcementSubject').value = '';
            document.getElementById('announcementMessage').value = '';
            document.querySelectorAll('#announcementModal input[type="checkbox"]').forEach(cb => cb.checked = false);
        } else {
            this.showMessage('error', 'Please fill in all fields and select recipients.');
        }
    }

    saveSettings() {
        const siteName = document.getElementById('siteName')?.value;
        const currency = document.getElementById('defaultCurrency')?.value;
        const timezone = document.getElementById('timezone')?.value;
        const commission = document.getElementById('platformCommission')?.value;
        const minPayout = document.getElementById('minPayout')?.value;

        // Simulate saving settings
        this.showMessage('success', 'Settings saved successfully!');
    }

    // Utility Functions
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showMessage(type, message) {
        // Create and show message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `;

        // Insert at top of main content
        const mainContent = document.querySelector('.main-content');
        const contentHeader = document.querySelector('.content-header');
        if (mainContent && contentHeader) {
            mainContent.insertBefore(messageDiv, contentHeader.nextSibling);
        }

        // Remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    performSearch(query) {
        // Implement global search functionality
        console.log('Searching for:', query);
    }

    // Mobile Menu Functions
    setupMobileMenu() {
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const sidebar = document.getElementById('sidebar');
        const mobileOverlay = document.getElementById('mobileMenuOverlay');
        
        if (hamburgerMenu && sidebar && mobileOverlay) {
            // Hamburger menu click handler
            hamburgerMenu.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
            
            // Overlay click handler - close menu
            mobileOverlay.addEventListener('click', () => {
                this.closeMobileMenu();
            });
            
            // Close mobile menu when clicking on menu items
            document.addEventListener('click', (e) => {
                if (e.target.closest('.menu-item') || e.target.closest('.submenu-item')) {
                    if (window.innerWidth <= 768) {
                        this.closeMobileMenu();
                    }
                }
            });
        }
    }
    
    toggleMobileMenu() {
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const sidebar = document.getElementById('sidebar');
        const mobileOverlay = document.getElementById('mobileMenuOverlay');
        
        if (hamburgerMenu && sidebar && mobileOverlay) {
            const isOpen = sidebar.classList.contains('mobile-open');
            
            if (isOpen) {
                this.closeMobileMenu();
            } else {
                this.openMobileMenu();
            }
        }
    }
    
    openMobileMenu() {
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const sidebar = document.getElementById('sidebar');
        const mobileOverlay = document.getElementById('mobileMenuOverlay');
        
        if (hamburgerMenu && sidebar && mobileOverlay) {
            hamburgerMenu.classList.add('active');
            sidebar.classList.add('mobile-open');
            mobileOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }
    
    closeMobileMenu() {
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const sidebar = document.getElementById('sidebar');
        const mobileOverlay = document.getElementById('mobileMenuOverlay');
        
        if (hamburgerMenu && sidebar && mobileOverlay) {
            hamburgerMenu.classList.remove('active');
            sidebar.classList.remove('mobile-open');
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling
        }
    }

    handleResize() {
        // Handle responsive behavior
        if (window.innerWidth <= 768) {
            // Mobile specific adjustments
        } else {
            // Close mobile menu when switching to desktop
            this.closeMobileMenu();
        }
    }

    startRealTimeUpdates() {
        // Simulate real-time updates
        setInterval(() => {
            // Update stats occasionally
            if (Math.random() < 0.1) { // 10% chance per interval
                this.data.stats.totalUsers += Math.floor(Math.random() * 5);
                this.data.stats.totalRevenue += Math.floor(Math.random() * 10000);
                this.updateDashboardStats();
            }
        }, 30000); // Every 30 seconds
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('adminUser');
            window.location.href = 'admin_login.html';
        }
    }
}

// Global functions for onclick handlers
function switchTab(tabName) {
    if (window.adminDashboard) {
        window.adminDashboard.switchTab(tabName);
    }
}

function showAnnouncementModal() {
    if (window.adminDashboard) {
        window.adminDashboard.showAnnouncementModal();
    }
}

function closeModal(modalId) {
    if (window.adminDashboard) {
        window.adminDashboard.closeModal(modalId);
    }
}

function sendAnnouncement() {
    if (window.adminDashboard) {
        window.adminDashboard.sendAnnouncement();
    }
}

function saveSettings() {
    if (window.adminDashboard) {
        window.adminDashboard.saveSettings();
    }
}

function logout() {
    if (window.adminDashboard) {
        window.adminDashboard.logout();
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.adminDashboard = new AdminDashboard();
});

// Close modals when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

// Handle escape key to close modals
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
    }
});


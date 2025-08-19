class Dashboard {
    constructor() {
        this.currency = "XAF"; // 🔹 Global currency set to XAF

        this.data = {
            stats: {
                totalUsers: 1245,
                activeListings: 348,
                totalRevenue: 1850000,
                growthRate: 12.5
            },
            recentActivity: [
                { user: 'John Doe', action: 'added new property', time: '2 mins ago' },
                { user: 'Jane Smith', action: 'updated profile', time: '10 mins ago' },
                { user: 'Mike Johnson', action: 'completed transaction', time: '30 mins ago' },
            ],
            agents: [
                { name: 'Sarah Williams', listings: 45, rating: 4.9 },
                { name: 'James Brown', listings: 38, rating: 4.7 },
                { name: 'Emily Davis', listings: 32, rating: 4.8 },
            ],
            properties: [
                { id: 1, title: 'Luxury Apartment', location: 'Lagos', price: 1500000, status: 'Active' },
                { id: 2, title: 'Modern Villa', location: 'Abuja', price: 2500000, status: 'Pending' },
                { id: 3, title: 'Cozy Bungalow', location: 'Ibadan', price: 800000, status: 'Active' },
            ],
            pendingApprovals: [
                { id: 1, title: 'New Property', agent: 'Michael Scott', price: 1200000 },
                { id: 2, title: 'Luxury Condo', agent: 'Pam Beesly', price: 2000000 },
            ],
            transactions: [
                { id: 1, property: 'Luxury Apartment', buyer: 'Alice Cooper', amount: 1500000, status: 'Completed' },
                { id: 2, property: 'Modern Villa', buyer: 'Bob Marley', amount: 2500000, status: 'Pending' },
            ]
        };

        this.initializeDashboard();
    }

    initializeDashboard() {
        this.updateDashboardStats();
        this.populateRecentActivity();
        this.updateLeaderboard();
        this.populatePropertiesTable();
        this.populatePendingApprovals();
        this.populateTransactionsTable();
    }

    formatNumber(num) {
        return num.toLocaleString();
    }

    updateDashboardStats() {
        const statCards = document.querySelectorAll('.stat-card h3');
        statCards[0].textContent = this.formatNumber(this.data.stats.totalUsers);
        statCards[1].textContent = this.formatNumber(this.data.stats.activeListings);
        statCards[2].textContent = this.formatNumber(this.data.stats.totalRevenue) + " " + this.currency;
        statCards[3].textContent = this.data.stats.growthRate + '%';
    }

    populateRecentActivity() {
        const list = document.querySelector('.activity-list');
        list.innerHTML = this.data.recentActivity.map(activity => `
            <li>
                <span>${activity.user}</span>
                <span>${activity.action}</span>
                <span>${activity.time}</span>
            </li>
        `).join('');
    }

    updateLeaderboard() {
        const leaderboard = document.querySelector('.leaderboard');
        leaderboard.innerHTML = this.data.agents.map(agent => `
            <div class="leaderboard-item">
                <span class="agent-name">${agent.name}</span>
                <span class="listings">${agent.listings} listings</span>
                <span class="rating">⭐ ${agent.rating}</span>
                <span class="revenue">${(agent.listings * 15000).toLocaleString()} ${this.currency}</span>
            </div>
        `).join('');
    }

    populatePropertiesTable() {
        const tbody = document.querySelector('.properties-table tbody');
        tbody.innerHTML = this.data.properties.map(property => `
            <tr>
                <td>${property.id}</td>
                <td>${property.title}</td>
                <td>${property.location}</td>
                <td><strong>${property.price.toLocaleString()} ${this.currency}</strong></td>
                <td>${property.status}</td>
            </tr>
        `).join('');
    }

    populatePendingApprovals() {
        const list = document.querySelector('.approvals-list');
        list.innerHTML = this.data.pendingApprovals.map(property => `
            <div class="approval-item">
                <h4>${property.title}</h4>
                <p>Agent: ${property.agent}</p>
                <div class="property-price">${property.price.toLocaleString()} ${this.currency} /month</div>
                <button class="approve-btn">Approve</button>
                <button class="reject-btn">Reject</button>
            </div>
        `).join('');
    }

    populateTransactionsTable() {
        const tbody = document.querySelector('.transactions-table tbody');
        tbody.innerHTML = this.data.transactions.map(transaction => `
            <tr>
                <td>${transaction.id}</td>
                <td>${transaction.property}</td>
                <td>${transaction.buyer}</td>
                <td><strong>${transaction.amount.toLocaleString()} ${this.currency}</strong></td>
                <td>${transaction.status}</td>
            </tr>
        `).join('');
    }
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});

// Wallet functionality
class WalletManager {
    constructor() {
        this.apiBaseUrl = window.APP_CONFIG.API_BASE_URL;
        this.walletContainer = document.querySelector('#wallet-page');
        this.init();
    }

    async init() {
        await this.setupWalletPage();
        this.setupEventListeners();
    }

    async setupWalletPage() {
        try {
            const balance = await this.fetchWalletBalance();
            const transactions = await this.fetchTransactions();
            this.renderWalletPage(balance, transactions);
        } catch (error) {
            console.error('Error setting up wallet page:', error);
            showNotification('Failed to load wallet information', 'error');
        }
    }

    async fetchWalletBalance() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/wallet/balance`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch wallet balance');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
            return { balance: 0, pendingBalance: 0 };
        }
    }

    async fetchTransactions() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/wallet/transactions`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching transactions:', error);
            return [];
        }
    }

    renderWalletPage(balance, transactions) {
        if (!this.walletContainer) return;

        this.walletContainer.innerHTML = `
            <div class="wallet-container">
                <div class="wallet-header">
                    <h2>My Wallet</h2>
                    <div class="wallet-actions">
                        <button class="add-funds-btn">Add Funds</button>
                        <button class="withdraw-btn">Withdraw</button>
                    </div>
                </div>

                <div class="balance-cards">
                    <div class="balance-card">
                        <h3>Available Balance</h3>
                        <p class="balance">${balance.balance.toLocaleString()} XAF</p>
                    </div>
                    <div class="balance-card">
                        <h3>Pending Balance</h3>
                        <p class="pending-balance">${balance.pendingBalance.toLocaleString()} XAF</p>
                    </div>
                </div>

                <div class="transactions-section">
                    <h3>Recent Transactions</h3>
                    ${this.renderTransactions(transactions)}
                </div>

                <div class="payment-methods-section">
                    <h3>Payment Methods</h3>
                    <div class="payment-methods">
                        <div class="add-payment-method">
                            <button class="add-payment-btn">
                                <i class="fas fa-plus"></i>
                                Add Payment Method
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderTransactions(transactions) {
        if (!transactions || transactions.length === 0) {
            return `
                <div class="empty-transactions">
                    <i class="fas fa-history"></i>
                    <p>No transactions yet</p>
                    <small>Your transaction history will appear here</small>
                </div>
            `;
        }

        return `
            <div class="transactions-list">
                ${transactions.map(transaction => `
                    <div class="transaction-item ${transaction.type}">
                        <div class="transaction-info">
                            <span class="transaction-type">${transaction.type}</span>
                            <span class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</span>
                        </div>
                        <div class="transaction-amount ${transaction.type === 'withdrawal' ? 'negative' : 'positive'}">
                            ${transaction.type === 'withdrawal' ? '-' : '+'} ${transaction.amount.toLocaleString()} XAF
                        </div>
                        <div class="transaction-status">
                            <span class="status-badge ${transaction.status.toLowerCase()}">${transaction.status}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    setupEventListeners() {
        if (!this.walletContainer) return;

        // Add funds button
        const addFundsBtn = this.walletContainer.querySelector('.add-funds-btn');
        if (addFundsBtn) {
            addFundsBtn.addEventListener('click', () => this.showAddFundsDialog());
        }

        // Withdraw button
        const withdrawBtn = this.walletContainer.querySelector('.withdraw-btn');
        if (withdrawBtn) {
            withdrawBtn.addEventListener('click', () => this.showWithdrawDialog());
        }

        // Add payment method button
        const addPaymentBtn = this.walletContainer.querySelector('.add-payment-btn');
        if (addPaymentBtn) {
            addPaymentBtn.addEventListener('click', () => this.showAddPaymentMethodDialog());
        }
    }

    showAddFundsDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'dialog-overlay';
        dialog.innerHTML = `
            <div class="dialog">
                <h3>Add Funds</h3>
                <form id="addFundsForm">
                    <div class="form-group">
                        <label for="amount">Amount (XAF)</label>
                        <input type="number" id="amount" name="amount" min="1000" required>
                    </div>
                    <div class="form-group">
                        <label for="paymentMethod">Payment Method</label>
                        <select id="paymentMethod" name="paymentMethod" required>
                            <option value="momo">Mobile Money</option>
                            <option value="card">Debit/Credit Card</option>
                            <option value="bank">Bank Transfer</option>
                        </select>
                    </div>
                    <div class="dialog-buttons">
                        <button type="button" class="cancel-btn">Cancel</button>
                        <button type="submit" class="submit-btn">Add Funds</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(dialog);

        const form = dialog.querySelector('#addFundsForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAddFunds(new FormData(form));
            document.body.removeChild(dialog);
        });

        dialog.querySelector('.cancel-btn').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    }

    showWithdrawDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'dialog-overlay';
        dialog.innerHTML = `
            <div class="dialog">
                <h3>Withdraw Funds</h3>
                <form id="withdrawForm">
                    <div class="form-group">
                        <label for="amount">Amount (XAF)</label>
                        <input type="number" id="amount" name="amount" min="1000" required>
                    </div>
                    <div class="form-group">
                        <label for="withdrawMethod">Withdrawal Method</label>
                        <select id="withdrawMethod" name="withdrawMethod" required>
                            <option value="momo">Mobile Money</option>
                            <option value="bank">Bank Account</option>
                        </select>
                    </div>
                    <div class="dialog-buttons">
                        <button type="button" class="cancel-btn">Cancel</button>
                        <button type="submit" class="submit-btn">Withdraw</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(dialog);

        const form = dialog.querySelector('#withdrawForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleWithdraw(new FormData(form));
            document.body.removeChild(dialog);
        });

        dialog.querySelector('.cancel-btn').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    }

    showAddPaymentMethodDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'dialog-overlay';
        dialog.innerHTML = `
            <div class="dialog">
                <h3>Add Payment Method</h3>
                <form id="paymentMethodForm">
                    <div class="form-group">
                        <label for="methodType">Payment Method Type</label>
                        <select id="methodType" name="methodType" required>
                            <option value="momo">Mobile Money</option>
                            <option value="bank">Bank Account</option>
                            <option value="card">Debit/Credit Card</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="accountNumber">Account Number</label>
                        <input type="text" id="accountNumber" name="accountNumber" required>
                    </div>
                    <div class="form-group">
                        <label for="accountName">Account Name</label>
                        <input type="text" id="accountName" name="accountName" required>
                    </div>
                    <div class="dialog-buttons">
                        <button type="button" class="cancel-btn">Cancel</button>
                        <button type="submit" class="submit-btn">Add Payment Method</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(dialog);

        const form = dialog.querySelector('#paymentMethodForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAddPaymentMethod(new FormData(form));
            document.body.removeChild(dialog);
        });

        dialog.querySelector('.cancel-btn').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    }

    async handleAddFunds(formData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/wallet/add-funds`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: formData.get('amount'),
                    paymentMethod: formData.get('paymentMethod')
                })
            });

            if (!response.ok) {
                throw new Error('Failed to add funds');
            }

            showNotification('Funds added successfully', 'success');
            await this.setupWalletPage(); // Refresh the page
        } catch (error) {
            console.error('Error adding funds:', error);
            showNotification('Failed to add funds', 'error');
        }
    }

    async handleWithdraw(formData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/wallet/withdraw`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: formData.get('amount'),
                    withdrawMethod: formData.get('withdrawMethod')
                })
            });

            if (!response.ok) {
                throw new Error('Failed to process withdrawal');
            }

            showNotification('Withdrawal request submitted successfully', 'success');
            await this.setupWalletPage(); // Refresh the page
        } catch (error) {
            console.error('Error processing withdrawal:', error);
            showNotification('Failed to process withdrawal', 'error');
        }
    }

    async handleAddPaymentMethod(formData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/wallet/payment-methods`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: formData.get('methodType'),
                    accountNumber: formData.get('accountNumber'),
                    accountName: formData.get('accountName')
                })
            });

            if (!response.ok) {
                throw new Error('Failed to add payment method');
            }

            showNotification('Payment method added successfully', 'success');
            await this.setupWalletPage(); // Refresh the page
        } catch (error) {
            console.error('Error adding payment method:', error);
            showNotification('Failed to add payment method', 'error');
        }
    }
}

// Initialize wallet when the page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#wallet-page')) {
        new WalletManager();
    }
});
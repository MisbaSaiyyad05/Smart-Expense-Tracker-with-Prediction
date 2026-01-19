// Expense Tracker Application
class ExpenseTracker {
    constructor() {
        this.expenses = this.loadExpenses();
        this.categoryChart = null;
        this.trendChart = null;
        this.init();
    }

    init() {
        // Set today's date as default
        document.getElementById('date').valueAsDate = new Date();
        
        // Event listeners
        document.getElementById('expenseForm').addEventListener('submit', (e) => this.handleAddExpense(e));
        document.getElementById('editForm').addEventListener('submit', (e) => this.handleEditExpense(e));
        document.getElementById('filterCategory').addEventListener('change', () => this.renderExpenses());
        document.getElementById('filterMonth').addEventListener('change', () => this.renderExpenses());
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelEdit').addEventListener('click', () => this.closeModal());
        
        // Populate month filter
        this.populateMonthFilter();
        
        // Initial render
        this.renderExpenses();
        this.updateStatistics();
        this.renderCharts();
    }

    // Local Storage Management
    loadExpenses() {
        const stored = localStorage.getItem('expenses');
        return stored ? JSON.parse(stored) : [];
    }

    saveExpenses() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
    }

    // Expense Management
    handleAddExpense(e) {
        e.preventDefault();
        
        const expense = {
            id: Date.now(),
            amount: parseFloat(document.getElementById('amount').value),
            category: document.getElementById('category').value,
            date: document.getElementById('date').value,
            description: document.getElementById('description').value || ''
        };

        this.expenses.push(expense);
        this.saveExpenses();
        
        // Reset form
        document.getElementById('expenseForm').reset();
        document.getElementById('date').valueAsDate = new Date();
        
        // Update UI
        this.renderExpenses();
        this.updateStatistics();
        this.renderCharts();
        this.populateMonthFilter();
        
        // Animation feedback
        this.showNotification('Expense added successfully!', 'success');
    }

    handleEditExpense(e) {
        e.preventDefault();
        
        const id = parseInt(document.getElementById('editId').value);
        const index = this.expenses.findIndex(exp => exp.id === id);
        
        if (index !== -1) {
            this.expenses[index] = {
                id: id,
                amount: parseFloat(document.getElementById('editAmount').value),
                category: document.getElementById('editCategory').value,
                date: document.getElementById('editDate').value,
                description: document.getElementById('editDescription').value || ''
            };
            
            this.saveExpenses();
            this.closeModal();
            this.renderExpenses();
            this.updateStatistics();
            this.renderCharts();
            this.showNotification('Expense updated successfully!', 'success');
        }
    }

    deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            this.expenses = this.expenses.filter(exp => exp.id !== id);
            this.saveExpenses();
            this.renderExpenses();
            this.updateStatistics();
            this.renderCharts();
            this.showNotification('Expense deleted successfully!', 'success');
        }
    }

    editExpense(id) {
        const expense = this.expenses.find(exp => exp.id === id);
        if (expense) {
            document.getElementById('editId').value = expense.id;
            document.getElementById('editAmount').value = expense.amount;
            document.getElementById('editCategory').value = expense.category;
            document.getElementById('editDate').value = expense.date;
            document.getElementById('editDescription').value = expense.description;
            document.getElementById('editModal').classList.add('show');
        }
    }

    closeModal() {
        document.getElementById('editModal').classList.remove('show');
    }

    // Filtering
    getFilteredExpenses() {
        let filtered = [...this.expenses];
        
        const categoryFilter = document.getElementById('filterCategory').value;
        const monthFilter = document.getElementById('filterMonth').value;
        
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(exp => exp.category === categoryFilter);
        }
        
        if (monthFilter !== 'all') {
            filtered = filtered.filter(exp => {
                const expDate = new Date(exp.date);
                return expDate.toISOString().slice(0, 7) === monthFilter;
            });
        }
        
        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    populateMonthFilter() {
        const monthSelect = document.getElementById('filterMonth');
        const months = new Set();
        
        this.expenses.forEach(exp => {
            const date = new Date(exp.date);
            months.add(date.toISOString().slice(0, 7));
        });
        
        const currentOptions = Array.from(monthSelect.options).map(opt => opt.value);
        const sortedMonths = Array.from(months).sort().reverse();
        
        sortedMonths.forEach(month => {
            if (!currentOptions.includes(month)) {
                const option = document.createElement('option');
                option.value = month;
                option.textContent = new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                monthSelect.appendChild(option);
            }
        });
    }

    // Rendering
    renderExpenses() {
        const expenseList = document.getElementById('expenseList');
        const filtered = this.getFilteredExpenses();
        
        if (filtered.length === 0) {
            expenseList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <p>No expenses found. Add your first expense above!</p>
                </div>
            `;
            return;
        }
        
        expenseList.innerHTML = filtered.map(expense => `
            <div class="expense-item">
                <div class="expense-info">
                    <span class="expense-category category-${expense.category}">${expense.category}</span>
                    <div class="expense-amount">$${expense.amount.toFixed(2)}</div>
                    <div class="expense-date">${new Date(expense.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</div>
                    ${expense.description ? `<div class="expense-description">${expense.description}</div>` : ''}
                </div>
                <div class="expense-actions">
                    <button class="btn btn-secondary btn-icon-only" onclick="expenseTracker.editExpense(${expense.id})" title="Edit">
                        ✏️
                    </button>
                    <button class="btn btn-danger btn-icon-only" onclick="expenseTracker.deleteExpense(${expense.id})" title="Delete">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateStatistics() {
        const total = this.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const monthly = this.getMonthlyTotal();
        const prediction = this.predictNextMonth();
        
        document.getElementById('totalExpenses').textContent = `$${total.toFixed(2)}`;
        document.getElementById('monthlyExpenses').textContent = `$${monthly.toFixed(2)}`;
        document.getElementById('prediction').textContent = `$${prediction.toFixed(2)}`;
    }

    getMonthlyTotal() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        return this.expenses
            .filter(exp => {
                const expDate = new Date(exp.date);
                return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
            })
            .reduce((sum, exp) => sum + exp.amount, 0);
    }

    // Linear Regression for Prediction
    predictNextMonth() {
        if (this.expenses.length < 2) {
            return 0;
        }

        // Group expenses by month
        const monthlyData = {};
        this.expenses.forEach(exp => {
            const date = new Date(exp.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = 0;
            }
            monthlyData[monthKey] += exp.amount;
        });

        // Convert to arrays for linear regression
        const months = Object.keys(monthlyData).sort();
        if (months.length < 2) {
            return monthlyData[months[0]] || 0;
        }

        const x = months.map((_, index) => index + 1);
        const y = months.map(month => monthlyData[month]);

        // Calculate linear regression
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Predict next month
        const nextMonthIndex = x.length + 1;
        const prediction = slope * nextMonthIndex + intercept;

        return Math.max(0, prediction); // Ensure non-negative
    }

    // Charts
    renderCharts() {
        this.renderCategoryChart();
        this.renderTrendChart();
    }

    renderCategoryChart() {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        
        // Calculate category totals
        const categoryTotals = {};
        this.expenses.forEach(exp => {
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
        });

        const categories = Object.keys(categoryTotals);
        const amounts = categories.map(cat => categoryTotals[cat]);

        // Color mapping
        const colors = {
            'Food': '#10b981',
            'Transport': '#6366f1',
            'Shopping': '#8b5cf6',
            'Bills': '#f59e0b',
            'Entertainment': '#ec4899',
            'Healthcare': '#ef4444',
            'Education': '#3b82f6',
            'Other': '#6b7280'
        };

        const backgroundColors = categories.map(cat => colors[cat] || '#6b7280');

        if (this.categoryChart) {
            this.categoryChart.destroy();
        }

        this.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: amounts,
                    backgroundColor: backgroundColors,
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#a0aec0',
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 35, 50, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#a0aec0',
                        borderColor: '#2d3748',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    renderTrendChart() {
        const ctx = document.getElementById('trendChart').getContext('2d');
        
        // Group expenses by month
        const monthlyData = {};
        this.expenses.forEach(exp => {
            const date = new Date(exp.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = 0;
            }
            monthlyData[monthKey] += exp.amount;
        });

        const months = Object.keys(monthlyData).sort();
        const amounts = months.map(month => monthlyData[month]);
        const monthLabels = months.map(month => {
            const date = new Date(month + '-01');
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        });

        // Add prediction for next month
        const prediction = this.predictNextMonth();
        if (prediction > 0 && months.length > 0) {
            const lastMonth = new Date(months[months.length - 1] + '-01');
            lastMonth.setMonth(lastMonth.getMonth() + 1);
            const nextMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
            monthLabels.push(new Date(nextMonthKey + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'short' }));
            amounts.push(prediction);
        }

        if (this.trendChart) {
            this.trendChart.destroy();
        }

        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthLabels,
                datasets: [{
                    label: 'Monthly Expenses',
                    data: amounts,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: '#8b5cf6',
                    pointHoverBorderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 35, 50, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#a0aec0',
                        borderColor: '#2d3748',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const isPrediction = context.dataIndex === amounts.length - 1 && prediction > 0;
                                const label = isPrediction ? 'Predicted: ' : '';
                                return label + '$' + context.parsed.y.toFixed(2);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#a0aec0',
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        },
                        grid: {
                            color: '#2d3748'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#a0aec0'
                        },
                        grid: {
                            color: '#2d3748'
                        }
                    }
                }
            }
        });
    }

    // Notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : '#6366f1'};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            font-weight: 500;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize the application
let expenseTracker;
document.addEventListener('DOMContentLoaded', () => {
    expenseTracker = new ExpenseTracker();
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('editModal');
    if (e.target === modal) {
        expenseTracker.closeModal();
    }
});

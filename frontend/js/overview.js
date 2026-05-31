// ═════════════════════════════════════════════════════════════
// OVERVIEW / DASHBOARD COMPONENT
// ═════════════════════════════════════════════════════════════

WealthifyApp.prototype.setupSortableHeaders = function() {
    document.querySelectorAll('.data-table th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.getAttribute('data-col');
            const table = th.getAttribute('data-table');
            if (table !== 'dashboard') return;

            if (this.dashboardSort.col === col) {
                this.dashboardSort.dir = this.dashboardSort.dir === 'asc' ? 'desc' : 'asc';
            } else {
                this.dashboardSort.col = col;
                this.dashboardSort.dir = 'asc';
            }

            document.querySelectorAll(`th[data-table="dashboard"]`).forEach(h => {
                h.classList.remove('sort-asc', 'sort-desc');
            });
            th.classList.add(this.dashboardSort.dir === 'asc' ? 'sort-asc' : 'sort-desc');

            this.renderDashboardTable(this.getSortedDashboardData());
        });
    });
};

WealthifyApp.prototype.getSortedDashboardData = function() {
    const { col, dir } = this.dashboardSort;
    if (!col) return [...this.dashboardData];

    return [...this.dashboardData].sort((a, b) => {
        let va = a[col];
        let vb = b[col];
        if (typeof va === 'string') {
            va = va.toLowerCase();
            vb = vb.toLowerCase();
        }
        if (va < vb) return dir === 'asc' ? -1 : 1;
        if (va > vb) return dir === 'asc' ? 1 : -1;
        return 0;
    });
};

WealthifyApp.prototype.loadDashboard = async function() {
    const startDate = document.getElementById('dash-start-date')?.value;
    const endDate = document.getElementById('dash-end-date')?.value;

    this.showSkeleton('dashboard-tbody', 4, 4);
    this.showChartSkeleton('chart-skeleton-1');
    this.showChartSkeleton('chart-skeleton-2');

    if (this.isOffline) {
        this.showOfflineState('dashboard-tbody', 4);
        this.showChartOfflineState('fundInvestmentChart');
        this.showChartOfflineState('fundUnitsChart');
        
        document.getElementById('stat-total-invested').textContent = '—';
        document.getElementById('stat-total-units').textContent = '—';
        document.getElementById('stat-avg-nav').textContent = '—';
        document.getElementById('stat-fund-count').textContent = '—';
        return;
    }

    const data = await this.fetchAPI('/mutualfund-overall', {
        start_date: startDate,
        end_date: endDate,
    });

    if (data === null) {
        this.showOfflineState('dashboard-tbody', 4);
        this.showChartOfflineState('fundInvestmentChart');
        this.showChartOfflineState('fundUnitsChart');
        
        document.getElementById('stat-total-invested').textContent = '—';
        document.getElementById('stat-total-units').textContent = '—';
        document.getElementById('stat-avg-nav').textContent = '—';
        document.getElementById('stat-fund-count').textContent = '—';
        return;
    }

    this.dashboardData = data;

    const totalInvested = data.reduce((s, r) => s + r.total_amount, 0);
    const totalUnits = data.reduce((s, r) => s + r.total_units, 0);
    const avgNav = totalUnits > 0 ? totalInvested / totalUnits : 0;
    const fundCount = data.length;

    this.animateValue(document.getElementById('stat-total-invested'), totalInvested, true);
    this.animateValue(document.getElementById('stat-total-units'), totalUnits);
    this.animateValue(document.getElementById('stat-avg-nav'), avgNav, true);
    this.animateValue(document.getElementById('stat-fund-count'), fundCount);

    this.toggleEmpty('dashboard-empty', data.length === 0);
    this.renderDashboardTable(this.getSortedDashboardData());
    this.renderCharts(data);
};

WealthifyApp.prototype.renderDashboardTable = function(data) {
    const tbody = document.getElementById('dashboard-tbody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '';
        return;
    }

    tbody.innerHTML = data.map(r => `
        <tr>
            <td><span class="fund-tag">${this.escapeHtml(r.mutual_fund)}</span></td>
            <td class="text-right"><span class="amount-text">${this.formatCurrency(r.total_amount)}</span></td>
            <td class="text-right">${this.formatNumber(r.total_units)}</td>
            <td class="text-right">${this.formatCurrency(r.average_nav)}</td>
        </tr>
    `).join('');
};

WealthifyApp.prototype.renderCharts = function(data) {
    const sortedData = [...data].sort((a, b) => b.total_amount - a.total_amount);
    const fullLabels = sortedData.map(d => d.mutual_fund);
    const truncatedLabels = sortedData.map(d => this.truncateLabel(d.mutual_fund, 25));
    const amounts = sortedData.map(d => d.total_amount);
    const units = sortedData.map(d => d.total_units);
    const colors = this.getThemeColors();

    const chartColors = [
        '#10b981', '#34d399', '#059669', '#fbbf24', '#06b6d4',
        '#f43f5e', '#14b8a6', '#047857', '#f59e0b', '#ec4899',
        '#10b981', '#34d399', '#059669', '#fbbf24', '#06b6d4'
    ];

    // Bar Chart
    if (this.charts.fundInvestment) this.charts.fundInvestment.destroy();
    const ctx1 = document.getElementById('fundInvestmentChart');
    if (ctx1) {
        this.charts.fundInvestment = new Chart(ctx1.getContext('2d'), {
            type: 'bar',
            data: {
                labels: fullLabels,
                datasets: [{
                    label: 'Total Invested (₹)',
                    data: amounts,
                    backgroundColor: chartColors.slice(0, amounts.length),
                    borderRadius: 8,
                    borderSkipped: false,
                    maxBarThickness: 50,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { bottom: 30 } },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: colors.bg,
                        titleColor: colors.text,
                        bodyColor: colors.text,
                        borderColor: colors.grid,
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: (ctx) => ` ₹${this.formatNumber(ctx.parsed.y)}`,
                        },
                    },
                },
                scales: {
                    x: {
                        ticks: {
                            color: colors.text,
                            font: { size: 11 },
                            maxRotation: 45,
                            callback: function (val) {
                                const label = this.getLabelForValue(val);
                                return label.length > 18 ? label.substring(0, 18) + '…' : label;
                            }
                        },
                        grid: { display: false },
                    },
                    y: {
                        ticks: {
                            color: colors.text,
                            font: { size: 11 },
                            callback: (v) => `₹${(v / 1000).toFixed(0)}K`,
                        },
                        grid: { color: colors.grid, drawBorder: false },
                    },
                },
            },
        });
    }
    this.hideChartSkeleton('chart-skeleton-1');

    // Doughnut Chart
    if (this.charts.fundUnits) this.charts.fundUnits.destroy();
    const ctx2 = document.getElementById('fundUnitsChart');
    if (ctx2) {
        this.charts.fundUnits = new Chart(ctx2.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: truncatedLabels,
                datasets: [{
                    data: units,
                    backgroundColor: chartColors.slice(0, units.length),
                    borderWidth: 0,
                    hoverOffset: 8,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: colors.text,
                            padding: 14,
                            font: { size: 11 },
                            usePointStyle: true,
                            pointStyleWidth: 10,
                        },
                    },
                    tooltip: {
                        backgroundColor: colors.bg,
                        titleColor: colors.text,
                        bodyColor: colors.text,
                        borderColor: colors.grid,
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            title: (tooltipItems) => {
                                const index = tooltipItems[0].dataIndex;
                                return fullLabels[index];
                            },
                            label: (ctx) => ` ${this.formatNumber(ctx.parsed)} units`,
                        },
                    },
                },
            },
        });
    }
    this.hideChartSkeleton('chart-skeleton-2');
};

WealthifyApp.prototype.resetDashboardFilters = function() {
    const s = document.getElementById('dash-start-date');
    const e = document.getElementById('dash-end-date');
    if (s) s.value = '';
    if (e) e.value = '';
    this.loadDashboard();
};

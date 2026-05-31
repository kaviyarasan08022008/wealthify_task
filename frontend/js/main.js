const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? (window.location.port === '8080' ? '/api' : 'http://127.0.0.1:8080/api')
    : (window.location.protocol === 'file:')
        ? 'http://127.0.0.1:8080/api'
        : `${window.location.protocol}//${window.location.host}/api`;

// ─────────────────────────────────────────────────────────────────
// OFFLINE FALLBACK ENGINE (MOCK DATABASE & LOCALSTORAGE)
// ─────────────────────────────────────────────────────────────────
const MOCK_INVESTORS = [
    { id: 1, name: "Kaviyarasan", pan_number: "ABCDE1234F" },
    { id: 2, name: "Rajesh Kumar", pan_number: "FGHIJ5678K" },
    { id: 3, name: "Priya Sharma", pan_number: "LMNOP9012Q" },
    { id: 4, name: "Amit Patel", pan_number: "RSTUV3456W" }
];

const MOCK_FUNDS = [
    { id: 1, name: "Axis Bluechip Fund", amc_code: "AXIS", scheme_type: "Equity" },
    { id: 2, name: "SBI Bluechip Fund", amc_code: "SBI", scheme_type: "Equity" },
    { id: 3, name: "HDFC Mid-Cap Opportunities Fund", amc_code: "HDFC", scheme_type: "Equity" },
    { id: 4, name: "ICICI Prudential Liquid Fund", amc_code: "ICICI", scheme_type: "Debt" }
];

const MOCK_TRANSACTIONS = [
    { id: 1, investor_id: 1, fund_id: 1, transaction_date: "2026-05-10", amount: 50000.0, nav: 50.0, units: 1000.0 },
    { id: 2, investor_id: 1, fund_id: 2, transaction_date: "2026-05-12", amount: 30000.0, nav: 60.0, units: 500.0 },
    { id: 3, investor_id: 2, fund_id: 1, transaction_date: "2026-05-15", amount: 75000.0, nav: 50.0, units: 1500.0 },
    { id: 4, investor_id: 3, fund_id: 3, transaction_date: "2026-05-18", amount: 100000.0, nav: 100.0, units: 1000.0 },
    { id: 5, investor_id: 4, fund_id: 4, transaction_date: "2026-05-20", amount: 20000.0, nav: 20.0, units: 1000.0 },
    { id: 6, investor_id: 2, fund_id: 3, transaction_date: "2026-05-22", amount: 50000.0, nav: 100.0, units: 500.0 },
    { id: 7, investor_id: 3, fund_id: 1, transaction_date: "2026-05-25", amount: 25000.0, nav: 50.0, units: 500.0 }
];

class LocalDB {
    constructor() {
        if (!localStorage.getItem('wealthify_investors')) {
            localStorage.setItem('wealthify_investors', JSON.stringify(MOCK_INVESTORS));
        }
        if (!localStorage.getItem('wealthify_funds')) {
            localStorage.setItem('wealthify_funds', JSON.stringify(MOCK_FUNDS));
        }
        if (!localStorage.getItem('wealthify_transactions')) {
            localStorage.setItem('wealthify_transactions', JSON.stringify(MOCK_TRANSACTIONS));
        }
    }

    getInvestors() {
        return JSON.parse(localStorage.getItem('wealthify_investors'));
    }

    saveInvestors(data) {
        localStorage.setItem('wealthify_investors', JSON.stringify(data));
    }

    getFunds() {
        return JSON.parse(localStorage.getItem('wealthify_funds'));
    }

    saveFunds(data) {
        localStorage.setItem('wealthify_funds', JSON.stringify(data));
    }

    getTransactions() {
        return JSON.parse(localStorage.getItem('wealthify_transactions'));
    }

    saveTransactions(data) {
        localStorage.setItem('wealthify_transactions', JSON.stringify(data));
    }
}

const localDB = new LocalDB();

// ─────────────────────────────────────────────────────────────────
// MAIN COORDINATOR CLASS
// ─────────────────────────────────────────────────────────────────
class WealthifyApp {
    constructor() {
        this.currentView = 'dashboard';
        this.pages = {
            investorSummary: 1,
            fundSummary: 1,
            investors: 1,
            transactions: 1,
            funds: 1,
        };
        this.pageSize = 15;
        this.crudSearch = {
            transactions: '',
            investors: '',
            funds: ''
        };
        this.currentCrudEntity = null;
        this.currentCrudAction = null;
        this.currentCrudItemId = null;
        this.dashboardData = [];
        this.dashboardSort = { col: null, dir: 'asc' };
        this.charts = {
            fundInvestment: null,
            fundUnits: null,
        };
        this.isOffline = false;

        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupMobileSidebar();
        this.setHeaderDate();
        this.checkApiHealth().then(() => {
            this.setupCrud();
            
            const activeView = document.querySelector('.view');
            if (activeView) {
                const viewId = activeView.id;
                this.currentView = viewId;
                
                if (viewId === 'dashboard' && typeof this.setupSortableHeaders === 'function') {
                    this.setupSortableHeaders();
                }
                
                this.loadViewByKey(viewId);
            }
        });
    }

    setHeaderDate() {
        const el = document.getElementById('header-date-text');
        if (el) {
            const d = new Date();
            el.textContent = d.toLocaleDateString('en-IN', {
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
            });
        }
    }

    async checkApiHealth() {
        const dot = document.getElementById('status-dot');
        const txt = document.getElementById('status-text');
        if (!dot || !txt) return;

        dot.className = 'status-dot connecting';
        txt.textContent = 'Connecting...';

        try {
            const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
            if (res.ok) {
                this.isOffline = false;
                dot.className = 'status-dot online';
                txt.textContent = 'API Online';
            } else {
                this.isOffline = true;
                dot.className = 'status-dot offline';
                txt.textContent = 'API Offline';
                this.showToast('Backend offline. Mutual fund data is unavailable.', 'error');
            }
        } catch {
            this.isOffline = true;
            dot.className = 'status-dot offline';
            txt.textContent = 'API Offline';
            this.showToast('Backend offline. Mutual fund data is unavailable.', 'error');
        }
    }

    setupNavigation() {
        const items = document.querySelectorAll('.nav-item[data-view]');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.getAttribute('data-view');
                this.switchView(view);
                items.forEach(n => n.classList.remove('active'));
                item.classList.add('active');
                this.closeSidebar();
            });
        });
    }

    switchView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const target = document.getElementById(viewId);
        if (target) target.classList.add('active');
        this.currentView = viewId;

        const bc = document.getElementById('breadcrumb-current');
        const labels = {
            'dashboard': 'Overview',
            'transactions': 'Transactions',
            'investors': 'All Investors',
            'funds': 'All Funds',
            'investor-summary': 'Investor Summary',
            'fund-summary': 'Fund Summary',
        };
        if (bc) bc.textContent = labels[viewId] || viewId;

        if (viewId === 'dashboard') this.loadDashboard();
        if (viewId === 'transactions') this.loadTransactionsList();
        if (viewId === 'investors') this.loadInvestorsList();
        if (viewId === 'funds') this.loadFundsList();
        if (viewId === 'investor-summary') this.loadInvestorSummary();
        if (viewId === 'fund-summary') this.loadFundSummary();
    }

    setupMobileSidebar() {
        const ham = document.getElementById('hamburger');
        const close = document.getElementById('sidebar-close');
        const overlay = document.getElementById('sidebar-overlay');

        if (ham) ham.addEventListener('click', () => this.openSidebar());
        if (close) close.addEventListener('click', () => this.closeSidebar());
        if (overlay) overlay.addEventListener('click', () => this.closeSidebar());
    }

    openSidebar() {
        document.getElementById('sidebar')?.classList.add('open');
        document.getElementById('sidebar-overlay')?.classList.add('open');
    }

    closeSidebar() {
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebar-overlay')?.classList.remove('open');
    }

    getThemeColors() {
        return {
            text: '#a7f3d0',
            grid: 'rgba(16, 185, 129, 0.08)',
            bg: '#0a1210',
        };
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    }

    formatNumber(num, decimals = 2) {
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: decimals,
        }).format(num);
    }

    animateValue(el, endVal, isCurrency = false) {
        const duration = 600;
        const startTime = performance.now();
        const startVal = 0;

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            const current = startVal + (endVal - startVal) * ease;

            el.textContent = isCurrency
                ? this.formatCurrency(current)
                : this.formatNumber(current);

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = isCurrency
                    ? this.formatCurrency(endVal)
                    : this.formatNumber(endVal);
            }
        };
        requestAnimationFrame(step);
    }

    showSkeleton(tbodyId, cols = 4, rows = 5) {
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;
        tbody.innerHTML = '';
        for (let i = 0; i < rows; i++) {
            const tr = document.createElement('tr');
            tr.className = 'skeleton-row';
            tr.innerHTML = `<td colspan="${cols}"><div class="skeleton-line"></div></td>`;
            tbody.appendChild(tr);
        }
    }

    hideChartSkeleton(id) {
        const sk = document.getElementById(id);
        if (sk) sk.classList.add('hidden');
    }

    showChartSkeleton(id) {
        const sk = document.getElementById(id);
        if (sk) sk.classList.remove('hidden');
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const icons = {
            success: 'fa-check',
            error: 'fa-xmark',
            info: 'fa-info',
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon"><i class="fa-solid ${icons[type] || icons.info}"></i></div>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.closest('.toast').remove()">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    toggleEmpty(emptyId, show) {
        const el = document.getElementById(emptyId);
        if (!el) return;
        if (show) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    }

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    truncateLabel(text, max = 25) {
        if (!text) return '';
        return text.length > max ? text.substring(0, max) + '…' : text;
    }

    // ── BASE API FETCH & REQUEST WRAPPERS ──
    async fetchAPI(endpoint, params = {}) {
        if (this.isOffline) {
            return null;
        }
        try {
            const url = new URL(`${API_BASE}${endpoint}`);
            Object.entries(params).forEach(([key, val]) => {
                if (val !== undefined && val !== null && val !== '') {
                    url.searchParams.append(key, val);
                }
            });

            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error(`API Fetch Error [${endpoint}]:`, err);
            return null;
        }
    }

    async requestAPI(endpoint, method = 'GET', body = null, params = {}) {
        if (this.isOffline) {
            this.showToast('Action failed: Backend server is disconnected.', 'error');
            throw new Error("Backend offline");
        }
        try {
            const url = new URL(`${API_BASE}${endpoint}`);
            Object.entries(params).forEach(([key, val]) => {
                if (val !== undefined && val !== null && val !== '') {
                    url.searchParams.append(key, val);
                }
            });

            const options = {
                method,
                headers: { "Content-Type": "application/json" }
            };
            if (body && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(body);
            }

            const res = await fetch(url, options);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            if (method !== 'DELETE') return await res.json();
            return { success: true };
        } catch (err) {
            console.error(`API Request Error [${endpoint}]:`, err);
            throw err;
        }
    }

    showOfflineState(tbodyId, cols = 4) {
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;
        tbody.innerHTML = `
            <tr>
                <td colspan="${cols}" class="table-empty offline-state">
                    <div class="offline-icon"><i class="fa-solid fa-plug-circle-xmark"></i></div>
                    <h3>Backend Offline</h3>
                    <p>Mutual fund data cannot be loaded because the server is offline. Please start your FastAPI backend server to view and manage transactions.</p>
                    <button class="btn btn-ghost btn-sm" onclick="app.checkApiHealth().then(() => app.loadViewByKey(app.currentView))">
                        <i class="fa-solid fa-arrows-rotate"></i> Retry Connection
                    </button>
                </td>
            </tr>
        `;
    }

    showChartOfflineState(canvasId, message = "Chart unavailable - Server offline") {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const wrap = canvas.parentElement;
        if (!wrap) return;
        const oldPlaceholder = wrap.querySelector('.chart-offline-overlay');
        if (oldPlaceholder) oldPlaceholder.remove();

        const div = document.createElement('div');
        div.className = 'chart-offline-overlay';
        div.innerHTML = `
            <div class="offline-chart-content">
                <i class="fa-solid fa-chart-pie"></i>
                <p>${message}</p>
            </div>
        `;
        wrap.appendChild(div);
    }

    // ── PAGINATION SYSTEM ──
    updatePagination(prefix, page, resultCount) {
        const prevBtn = document.getElementById(`${prefix}-prev`);
        const nextBtn = document.getElementById(`${prefix}-next`);
        const pageNum = document.getElementById(`${prefix}-page-num`);
        const pageInfo = document.getElementById(`${prefix}-page-info`);

        if (prevBtn) prevBtn.disabled = (page <= 1);
        if (nextBtn) nextBtn.disabled = (resultCount < this.pageSize);
        if (pageNum) pageNum.textContent = page;
        if (pageInfo) pageInfo.textContent = `Page ${page}`;
    }

    nextPage(viewKey) {
        this.pages[viewKey]++;
        this.loadViewByKey(viewKey);
    }

    prevPage(viewKey) {
        if (this.pages[viewKey] > 1) {
            this.pages[viewKey]--;
            this.loadViewByKey(viewKey);
        }
    }

    resetPageAndLoad(viewKey) {
        this.pages[viewKey] = 1;
        this.loadViewByKey(viewKey);
    }

    loadViewByKey(viewKey) {
        if (viewKey === 'dashboard') this.loadDashboard();
        if (viewKey === 'investorSummary' || viewKey === 'investor-summary') this.loadInvestorSummary();
        if (viewKey === 'fundSummary' || viewKey === 'fund-summary') this.loadFundSummary();
        if (viewKey === 'investors') this.loadInvestorsList();
        if (viewKey === 'transactions') this.loadTransactionsList();
        if (viewKey === 'funds') this.loadFundsList();
    }

    // ── CRUD SYSTEM CONTROLLER ──
    setupCrud() {
        document.getElementById('all-txns-search')?.addEventListener('input', (e) => {
            this.crudSearch.transactions = e.target.value;
            this.pages.transactions = 1;
            this.loadTransactionsList();
        });
        document.getElementById('all-inv-search')?.addEventListener('input', (e) => {
            this.pages.investors = 1;
            this.loadInvestorsList();
        });
        document.getElementById('all-funds-search')?.addEventListener('input', (e) => {
            this.crudSearch.funds = e.target.value;
            this.pages.funds = 1;
            this.loadFundsList();
        });

        document.getElementById('crud-modal-close')?.addEventListener('click', () => this.closeCrudModal());
        document.getElementById('btn-modal-cancel')?.addEventListener('click', () => this.closeCrudModal());
        document.getElementById('btn-modal-save')?.addEventListener('click', () => this.submitCrudForm());
    }

    async openCrudModal(entity, action, itemId = null) {
        this.currentCrudEntity = entity;
        this.currentCrudAction = action;
        this.currentCrudItemId = itemId;

        const titleEl = document.getElementById('crud-modal-title');
        const formEl = document.getElementById('crud-form');
        const overlay = document.getElementById('crud-modal-overlay');

        if (!titleEl || !formEl || !overlay) return;

        titleEl.textContent = `${action === 'add' ? 'Add' : 'Edit'} ${entity.charAt(0).toUpperCase() + entity.slice(1)}`;
        formEl.innerHTML = '<p class="text-muted">Loading form...</p>';
        overlay.classList.add('active');

        try {
            let fieldsHtml = '';
            let itemData = null;

            if (action === 'edit' && itemId) {
                const endpoint = entity === 'transaction' ? `/transactions/${itemId}` : (entity === 'investor' ? `/investors/${itemId}` : `/funds/${itemId}`);
                itemData = await this.requestAPI(endpoint, 'GET');
            }

            if (entity === 'investor') {
                fieldsHtml = `
                    <div class="form-group">
                        <label class="form-label" for="inv-name-field">Investor Name</label>
                        <input type="text" id="inv-name-field" class="form-input" required value="${itemData ? this.escapeHtml(itemData.name || itemData.investor_name) : ''}" placeholder="Enter full name">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="inv-pan-field">PAN Number</label>
                        <input type="text" id="inv-pan-field" class="form-input" required value="${itemData ? this.escapeHtml(itemData.pan_number) : ''}" placeholder="Enter 10-digit PAN">
                    </div>
                `;
            } else if (entity === 'fund') {
                fieldsHtml = `
                    <div class="form-group">
                        <label class="form-label" for="fund-name-field">Mutual Fund Name</label>
                        <input type="text" id="fund-name-field" class="form-input" required value="${itemData ? this.escapeHtml(itemData.name) : ''}" placeholder="Enter scheme name">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="fund-amc-field">AMC Code</label>
                        <input type="text" id="fund-amc-field" class="form-input" value="${itemData && itemData.amc_code ? this.escapeHtml(itemData.amc_code) : ''}" placeholder="e.g. AXIS, KOTAK">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="fund-type-field">Scheme Type</label>
                        <input type="text" id="fund-type-field" class="form-input" value="${itemData && itemData.scheme_type ? this.escapeHtml(itemData.scheme_type) : ''}" placeholder="e.g. Equity, Debt, Gold">
                    </div>
                `;
            } else if (entity === 'transaction') {
                const allInv = await this.requestAPI('/investors/list', 'GET', null, { limit: 100 }) || [];
                const allFunds = await this.requestAPI('/funds/list', 'GET', null, { limit: 100 }) || [];

                const investorOptions = allInv.map(i => `
                    <option value="${i.id}" ${itemData && itemData.investor_id === i.id ? 'selected' : ''}>
                        ${this.escapeHtml(i.name || i.investor_name)} (${i.pan_number})
                    </option>
                `).join('');

                const fundOptions = allFunds.map(f => `
                    <option value="${f.id}" ${itemData && itemData.fund_id === f.id ? 'selected' : ''}>
                        ${this.escapeHtml(f.name)}
                    </option>
                `).join('');

                fieldsHtml = `
                    <div class="form-group">
                        <label class="form-label" for="txn-investor-field">Investor</label>
                        <select id="txn-investor-field" class="form-select" required>
                            <option value="">-- Select Investor --</option>
                            ${investorOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="txn-fund-field">Mutual Fund</label>
                        <select id="txn-fund-field" class="form-select" required>
                            <option value="">-- Select Mutual Fund --</option>
                            ${fundOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="txn-date-field">Transaction Date</label>
                        <input type="date" id="txn-date-field" class="form-input" required value="${itemData ? itemData.transaction_date : new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="txn-amount-field">Amount (₹)</label>
                        <input type="number" step="0.01" id="txn-amount-field" class="form-input" required value="${itemData ? itemData.amount : ''}" placeholder="0.00">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="txn-nav-field">NAV (₹)</label>
                        <input type="number" step="0.0001" id="txn-nav-field" class="form-input" required value="${itemData ? itemData.nav : ''}" placeholder="0.0000">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="txn-units-field">Units</label>
                        <input type="number" step="0.0001" id="txn-units-field" class="form-input" required value="${itemData ? itemData.units : ''}" placeholder="0.0000">
                    </div>
                `;
            }

            formEl.innerHTML = fieldsHtml;

            if (entity === 'transaction') {
                const amt = document.getElementById('txn-amount-field');
                const nav = document.getElementById('txn-nav-field');
                const units = document.getElementById('txn-units-field');
                const recalc = () => {
                    const a = parseFloat(amt.value) || 0;
                    const n = parseFloat(nav.value) || 0;
                    if (n > 0) units.value = (a / n).toFixed(4);
                };
                amt?.addEventListener('input', recalc);
                nav?.addEventListener('input', recalc);
            }
        } catch (e) {
            formEl.innerHTML = `<p class="text-danger">Failed to load form: ${e.message}</p>`;
        }
    }

    async submitCrudForm() {
        const entity = this.currentCrudEntity;
        const action = this.currentCrudAction;
        const itemId = this.currentCrudItemId;

        const form = document.getElementById('crud-form');
        if (!form) return;

        const inputs = form.querySelectorAll('[required]');
        for (let input of inputs) {
            if (!input.value.trim()) {
                this.showToast(`Please fill out all required fields`, 'error');
                input.focus();
                return;
            }
        }

        let body = {};
        let endpoint = '';

        if (entity === 'investor') {
            body = {
                name: document.getElementById('inv-name-field').value.trim(),
                pan_number: document.getElementById('inv-pan-field').value.trim()
            };
            endpoint = action === 'add' ? '/investors' : `/investors/${itemId}`;
        } else if (entity === 'fund') {
            body = {
                name: document.getElementById('fund-name-field').value.trim(),
                amc_code: document.getElementById('fund-amc-field').value.trim() || null,
                scheme_type: document.getElementById('fund-type-field').value.trim() || null
            };
            endpoint = action === 'add' ? '/funds' : `/funds/${itemId}`;
        } else if (entity === 'transaction') {
            body = {
                investor_id: parseInt(document.getElementById('txn-investor-field').value),
                fund_id: parseInt(document.getElementById('txn-fund-field').value),
                transaction_date: document.getElementById('txn-date-field').value,
                amount: parseFloat(document.getElementById('txn-amount-field').value),
                nav: parseFloat(document.getElementById('txn-nav-field').value),
                units: parseFloat(document.getElementById('txn-units-field').value)
            };
            endpoint = action === 'add' ? '/transactions' : `/transactions/${itemId}`;
        }

        const method = action === 'add' ? 'POST' : 'PUT';

        try {
            await this.requestAPI(endpoint, method, body);
            this.showToast(`${entity.charAt(0).toUpperCase() + entity.slice(1)} ${action === 'add' ? 'created' : 'updated'} successfully!`, 'success');
            this.closeCrudModal();
            this.loadViewByKey(this.currentView);
            this.loadDashboard();
        } catch (e) {
            this.showToast(`Operation failed: ${e.message}`, 'error');
        }
    }

    closeCrudModal() {
        const overlay = document.getElementById('crud-modal-overlay');
        if (overlay) overlay.classList.remove('active');
        this.currentCrudItemId = null;
    }

    editCrudItem(entity, id) {
        this.openCrudModal(entity, 'edit', id);
    }

    async deleteCrudItem(entity, id) {
        const confirmMsg = `Are you sure you want to delete this ${entity}? All linked records will be cascade deleted.`;
        if (!confirm(confirmMsg)) return;

        const endpoint = entity === 'transaction' ? `/transactions/${id}` : (entity === 'investor' ? `/investors/${id}` : `/funds/${id}`);

        try {
            await this.requestAPI(endpoint, 'DELETE');
            this.showToast(`${entity.charAt(0).toUpperCase() + entity.slice(1)} deleted successfully!`, 'success');
            this.loadViewByKey(this.currentView);
            this.loadDashboard();
        } catch (e) {
            this.showToast(`Delete failed: ${e.message}`, 'error');
        }
    }

    handleOfflineFetch(endpoint, params = {}) {
        const investors = localDB.getInvestors();
        const funds = localDB.getFunds();
        const transactions = localDB.getTransactions();

        if (endpoint === '/mutualfund-overall') {
            const { start_date, end_date } = params;
            const filteredTx = transactions.filter(t => {
                if (start_date && t.transaction_date < start_date) return false;
                if (end_date && t.transaction_date > end_date) return false;
                return true;
            });

            const fundStats = {};
            filteredTx.forEach(t => {
                if (!fundStats[t.fund_id]) {
                    fundStats[t.fund_id] = { total_amount: 0, total_units: 0 };
                }
                fundStats[t.fund_id].total_amount += t.amount;
                fundStats[t.fund_id].total_units += t.units;
            });

            return Object.entries(fundStats).map(([fundId, stat]) => {
                const fund = funds.find(f => f.id == fundId);
                return {
                    mutual_fund: fund ? fund.name : `Fund #${fundId}`,
                    total_amount: stat.total_amount,
                    total_units: stat.total_units,
                    average_nav: stat.total_units > 0 ? (stat.total_amount / stat.total_units) : 0
                };
            });
        }

        if (endpoint === '/investor-summary') {
            const { search, start_date, end_date, page = 1, limit = 15 } = params;
            
            const filteredTx = transactions.filter(t => {
                if (start_date && t.transaction_date < start_date) return false;
                if (end_date && t.transaction_date > end_date) return false;
                return true;
            });

            const invStats = {};
            investors.forEach(inv => {
                invStats[inv.id] = {
                    investor_name: inv.name,
                    total_amount: 0,
                    total_units: 0,
                    fundsMap: {}
                };
            });

            filteredTx.forEach(t => {
                if (!invStats[t.investor_id]) return;
                invStats[t.investor_id].total_amount += t.amount;
                invStats[t.investor_id].total_units += t.units;

                if (!invStats[t.investor_id].fundsMap[t.fund_id]) {
                    invStats[t.investor_id].fundsMap[t.fund_id] = { total_amount: 0, total_units: 0 };
                }
                invStats[t.investor_id].fundsMap[t.fund_id].total_amount += t.amount;
                invStats[t.investor_id].fundsMap[t.fund_id].total_units += t.units;
            });

            let list = Object.values(invStats).filter(inv => {
                if (search && !inv.investor_name.toLowerCase().includes(search.toLowerCase())) return false;
                return true;
            });

            list.forEach(inv => {
                inv.funds = Object.entries(inv.fundsMap).map(([fundId, fStat]) => {
                    const fund = funds.find(f => f.id == fundId);
                    return {
                        mutual_fund: fund ? fund.name : `Fund #${fundId}`,
                        total_amount: fStat.total_amount,
                        total_units: fStat.total_units
                    };
                });
                delete inv.fundsMap;
            });

            const startIdx = (page - 1) * limit;
            return list.slice(startIdx, startIdx + parseInt(limit));
        }

        if (endpoint === '/fund-summary') {
            const { start_date, end_date, page = 1, limit = 15 } = params;
            
            const filteredTx = transactions.filter(t => {
                if (start_date && t.transaction_date < start_date) return false;
                if (end_date && t.transaction_date > end_date) return false;
                return true;
            });

            const fundStats = {};
            funds.forEach(f => {
                fundStats[f.id] = {
                    mutual_fund: f.name,
                    total_amount: 0,
                    total_units: 0,
                    investorsMap: {}
                };
            });

            filteredTx.forEach(t => {
                if (!fundStats[t.fund_id]) return;
                fundStats[t.fund_id].total_amount += t.amount;
                fundStats[t.fund_id].total_units += t.units;

                if (!fundStats[t.fund_id].investorsMap[t.investor_id]) {
                    fundStats[t.fund_id].investorsMap[t.investor_id] = { amount: 0, units: 0 };
                }
                fundStats[t.fund_id].investorsMap[t.investor_id].amount += t.amount;
                fundStats[t.fund_id].investorsMap[t.investor_id].units += t.units;
            });

            let list = Object.values(fundStats);

            list.forEach(f => {
                f.investors = Object.entries(f.investorsMap).map(([invId, iStat]) => {
                    const inv = investors.find(i => i.id == invId);
                    return {
                        investor_name: inv ? inv.name : `Investor #${invId}`,
                        amount: iStat.amount,
                        units: iStat.units
                    };
                });
                delete f.investorsMap;
            });

            const startIdx = (page - 1) * limit;
            return list.slice(startIdx, startIdx + parseInt(limit));
        }

        if (endpoint === '/investors') {
            const { search, page = 1, limit = 15 } = params;
            
            let list = investors.map(inv => {
                const total = transactions
                    .filter(t => t.investor_id === inv.id)
                    .reduce((sum, t) => sum + t.amount, 0);

                return {
                    id: inv.id,
                    investor_name: inv.name,
                    pan_number: inv.pan_number,
                    total_investment: total
                };
            });

            if (search) {
                list = list.filter(i => i.investor_name.toLowerCase().includes(search.toLowerCase()));
            }

            const startIdx = (page - 1) * limit;
            return list.slice(startIdx, startIdx + parseInt(limit));
        }

        if (endpoint === '/funds/list') {
            const { search, page, limit } = params;
            
            let list = [...funds];
            if (search) {
                list = list.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || (f.amc_code && f.amc_code.toLowerCase().includes(search.toLowerCase())));
            }

            if (page && limit) {
                const startIdx = (page - 1) * limit;
                return list.slice(startIdx, startIdx + parseInt(limit));
            }
            return list;
        }

        if (endpoint === '/transactions') {
            const { search, page = 1, limit = 15 } = params;
            
            let list = [...transactions];
            list.sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));

            if (search) {
                list = list.filter(t => {
                    const inv = investors.find(i => i.id === t.investor_id);
                    const fund = funds.find(f => f.id === t.fund_id);
                    const invName = inv ? inv.name : '';
                    const fundName = fund ? fund.name : '';
                    return invName.toLowerCase().includes(search.toLowerCase()) || fundName.toLowerCase().includes(search.toLowerCase());
                });
            }

            const startIdx = (page - 1) * limit;
            return list.slice(startIdx, startIdx + parseInt(limit));
        }

        return null;
    }

    handleOfflineRequest(endpoint, method, body, params) {
        const investors = localDB.getInvestors();
        const funds = localDB.getFunds();
        const transactions = localDB.getTransactions();

        if (endpoint === '/investors/list' && method === 'GET') {
            return investors;
        }
        
        if (endpoint === '/funds/list' && method === 'GET') {
            return funds;
        }

        if (endpoint.startsWith('/investors/') && method === 'GET') {
            const id = parseInt(endpoint.split('/').pop());
            const item = investors.find(i => i.id === id);
            if (!item) throw new Error("Investor not found");
            return item;
        }

        if (endpoint.startsWith('/funds/') && method === 'GET') {
            const id = parseInt(endpoint.split('/').pop());
            const item = funds.find(f => f.id === id);
            if (!item) throw new Error("Fund not found");
            return item;
        }

        if (endpoint.startsWith('/transactions/') && method === 'GET') {
            const id = parseInt(endpoint.split('/').pop());
            const item = transactions.find(t => t.id === id);
            if (!item) throw new Error("Transaction not found");
            return item;
        }

        if (endpoint === '/investors' && method === 'POST') {
            const newId = investors.length > 0 ? Math.max(...investors.map(i => i.id)) + 1 : 1;
            const newItem = { id: newId, ...body };
            investors.push(newItem);
            localDB.saveInvestors(investors);
            return newItem;
        }

        if (endpoint.startsWith('/investors/') && method === 'PUT') {
            const id = parseInt(endpoint.split('/').pop());
            const idx = investors.findIndex(i => i.id === id);
            if (idx === -1) throw new Error("Investor not found");
            investors[idx] = { ...investors[idx], ...body };
            localDB.saveInvestors(investors);
            return investors[idx];
        }

        if (endpoint.startsWith('/investors/') && method === 'DELETE') {
            const id = parseInt(endpoint.split('/').pop());
            const idx = investors.findIndex(i => i.id === id);
            if (idx === -1) throw new Error("Investor not found");
            investors.splice(idx, 1);
            localDB.saveInvestors(investors);

            const filteredTx = transactions.filter(t => t.investor_id !== id);
            localDB.saveTransactions(filteredTx);
            return { success: true };
        }

        if (endpoint === '/funds' && method === 'POST') {
            const newId = funds.length > 0 ? Math.max(...funds.map(f => f.id)) + 1 : 1;
            const newItem = { id: newId, ...body };
            funds.push(newItem);
            localDB.saveFunds(funds);
            return newItem;
        }

        if (endpoint.startsWith('/funds/') && method === 'PUT') {
            const id = parseInt(endpoint.split('/').pop());
            const idx = funds.findIndex(f => f.id === id);
            if (idx === -1) throw new Error("Fund not found");
            funds[idx] = { ...funds[idx], ...body };
            localDB.saveFunds(funds);
            return funds[idx];
        }

        if (endpoint.startsWith('/funds/') && method === 'DELETE') {
            const id = parseInt(endpoint.split('/').pop());
            const idx = funds.findIndex(f => f.id === id);
            if (idx === -1) throw new Error("Fund not found");
            funds.splice(idx, 1);
            localDB.saveFunds(funds);

            const filteredTx = transactions.filter(t => t.fund_id !== id);
            localDB.saveTransactions(filteredTx);
            return { success: true };
        }

        if (endpoint === '/transactions' && method === 'POST') {
            const newId = transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1;
            const newItem = { id: newId, ...body };
            transactions.push(newItem);
            localDB.saveTransactions(transactions);
            return newItem;
        }

        if (endpoint.startsWith('/transactions/') && method === 'PUT') {
            const id = parseInt(endpoint.split('/').pop());
            const idx = transactions.findIndex(t => t.id === id);
            if (idx === -1) throw new Error("Transaction not found");
            transactions[idx] = { ...transactions[idx], ...body };
            localDB.saveTransactions(transactions);
            return transactions[idx];
        }

        if (endpoint.startsWith('/transactions/') && method === 'DELETE') {
            const id = parseInt(endpoint.split('/').pop());
            const idx = transactions.findIndex(t => t.id === id);
            if (idx === -1) throw new Error("Transaction not found");
            transactions.splice(idx, 1);
            localDB.saveTransactions(transactions);
            return { success: true };
        }

        return null;
    }
}


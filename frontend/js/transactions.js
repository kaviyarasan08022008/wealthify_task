// ═════════════════════════════════════════════════════════════
// TRANSACTIONS REGISTRY COMPONENT
// ═════════════════════════════════════════════════════════════

WealthifyApp.prototype.loadTransactionsList = async function() {
    const tbody = document.getElementById('transactions-tbody');
    if (!tbody) return;

    this.showSkeleton('transactions-tbody', 8, 5);

    if (this.isOffline) {
        this.showOfflineState('transactions-tbody', 8);
        return;
    }

    try {
        const search = document.getElementById('all-txns-search')?.value || '';
        const page = this.pages.transactions;
        const data = await this.fetchAPI('/transactions', {
            search,
            page,
            limit: this.pageSize
        });

        if (data === null) {
            this.showOfflineState('transactions-tbody', 8);
            return;
        }

        this.toggleEmpty('transactions-empty', data.length === 0);

        if (data.length === 0) {
            tbody.innerHTML = '';
        } else {
            const allInv = await this.requestAPI('/investors/list', 'GET', null, { limit: 100 }) || [];
            const allFunds = await this.requestAPI('/funds/list', 'GET', null, { limit: 100 }) || [];

            const invMap = {};
            allInv.forEach(i => invMap[i.id] = i.name || i.investor_name);
            const fundMap = {};
            allFunds.forEach(f => fundMap[f.id] = f.name);

            tbody.innerHTML = data.map(t => {
                const invName = invMap[t.investor_id] || `Investor #${t.investor_id}`;
                const fundName = fundMap[t.fund_id] || `Fund #${t.fund_id}`;
                return `
                    <tr>
                        <td><span class="row-index">${t.id}</span></td>
                        <td><strong>${this.escapeHtml(invName)}</strong></td>
                        <td><span class="fund-tag">${this.escapeHtml(fundName)}</span></td>
                        <td>${t.transaction_date}</td>
                        <td class="text-right amount-text">${this.formatCurrency(t.amount)}</td>
                        <td class="text-right">${this.formatNumber(t.nav)}</td>
                        <td class="text-right">${this.formatNumber(t.units)}</td>
                        <td>
                            <div class="action-btn-group">
                                <button class="action-btn action-btn-edit" onclick="app.editCrudItem('transaction', ${t.id})" aria-label="Edit transaction">
                                    <i class="fa-solid fa-pen"></i>
                                </button>
                                <button class="action-btn action-btn-delete" onclick="app.deleteCrudItem('transaction', ${t.id})" aria-label="Delete transaction">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        this.updatePagination('all-txns', page, data.length);
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="8" class="table-empty">Error loading transactions: ${e.message}</td></tr>`;
    }
};

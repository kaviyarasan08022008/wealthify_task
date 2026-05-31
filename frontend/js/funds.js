// ═════════════════════════════════════════════════════════════
// MUTUAL FUNDS REGISTRY COMPONENT
// ═════════════════════════════════════════════════════════════

WealthifyApp.prototype.loadFundsList = async function() {
    const tbody = document.getElementById('funds-tbody');
    if (!tbody) return;

    this.showSkeleton('funds-tbody', 5, 5);

    if (this.isOffline) {
        this.showOfflineState('funds-tbody', 5);
        return;
    }

    try {
        const search = document.getElementById('all-funds-search')?.value || '';
        const page = this.pages.funds;
        const data = await this.fetchAPI('/funds/list', {
            search,
            page,
            limit: this.pageSize
        });

        if (data === null) {
            this.showOfflineState('funds-tbody', 5);
            return;
        }

        this.toggleEmpty('funds-empty', data.length === 0);

        if (data.length === 0) {
            tbody.innerHTML = '';
        } else {
            tbody.innerHTML = data.map(f => `
                <tr>
                    <td><span class="row-index">${f.id}</span></td>
                    <td><strong>${this.escapeHtml(f.name)}</strong></td>
                    <td><span class="fund-tag">${this.escapeHtml(f.amc_code || 'N/A')}</span></td>
                    <td>${this.escapeHtml(f.scheme_type || 'N/A')}</td>
                    <td>
                        <div class="action-btn-group">
                            <button class="action-btn action-btn-edit" onclick="app.editCrudItem('fund', ${f.id})" aria-label="Edit fund">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="action-btn action-btn-delete" onclick="app.deleteCrudItem('fund', ${f.id})" aria-label="Delete fund">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        this.updatePagination('all-funds', page, data.length);
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" class="table-empty">Error loading funds: ${e.message}</td></tr>`;
    }
};

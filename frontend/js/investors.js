// ═════════════════════════════════════════════════════════════
// INVESTOR REGISTRY COMPONENT
// ═════════════════════════════════════════════════════════════

WealthifyApp.prototype.loadInvestorsList = async function() {
    const search = document.getElementById('all-inv-search')?.value;
    const startDate = document.getElementById('all-inv-start-date')?.value;
    const endDate = document.getElementById('all-inv-end-date')?.value;
    const page = this.pages.investors;

    this.showSkeleton('investors-tbody', 5, 5);

    if (this.isOffline) {
        this.showOfflineState('investors-tbody', 5);
        return;
    }

    const data = await this.fetchAPI('/investors', {
        search,
        start_date: startDate,
        end_date: endDate,
        page,
        limit: this.pageSize,
    });

    if (data === null) {
        this.showOfflineState('investors-tbody', 5);
        return;
    }

    const tbody = document.getElementById('investors-tbody');
    if (!tbody) return;

    this.toggleEmpty('investors-empty', data.length === 0);

    if (data.length === 0) {
        tbody.innerHTML = '';
    } else {
        const offset = (page - 1) * this.pageSize;
        tbody.innerHTML = data.map((r, i) => `
            <tr>
                <td><span class="row-index">${offset + i + 1}</span></td>
                <td><strong>${this.escapeHtml(r.investor_name)}</strong></td>
                <td><code style="font-size:0.8rem;color:var(--text-muted)">${this.escapeHtml(r.pan_number)}</code></td>
                <td class="text-right"><span class="amount-text">${this.formatCurrency(r.total_investment)}</span></td>
                <td>
                    <div class="action-btn-group">
                        <button class="action-btn action-btn-edit" onclick="app.editCrudItem('investor', ${r.id})" aria-label="Edit investor">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="action-btn action-btn-delete" onclick="app.deleteCrudItem('investor', ${r.id})" aria-label="Delete investor">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    this.updatePagination('all-inv', page, data.length);

    const label = document.getElementById('all-inv-count-label');
    if (label) label.textContent = `Showing page ${page} · ${data.length} records`;
};

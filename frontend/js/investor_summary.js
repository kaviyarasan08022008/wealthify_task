// ═════════════════════════════════════════════════════════════
// INVESTOR SUMMARY (DRILL-DOWN ACCORDION) COMPONENT
// ═════════════════════════════════════════════════════════════

WealthifyApp.prototype.loadInvestorSummary = async function() {
    const search = document.getElementById('inv-search')?.value;
    const startDate = document.getElementById('inv-start-date')?.value;
    const endDate = document.getElementById('inv-end-date')?.value;
    const page = this.pages.investorSummary;

    this.showSkeleton('investor-summary-tbody', 4, 5);

    if (this.isOffline) {
        this.showOfflineState('investor-summary-tbody', 4);
        return;
    }

    const data = await this.fetchAPI('/investor-summary', {
        search,
        start_date: startDate,
        end_date: endDate,
        page,
        limit: this.pageSize,
    });

    if (data === null) {
        this.showOfflineState('investor-summary-tbody', 4);
        return;
    }

    const tbody = document.getElementById('investor-summary-tbody');
    if (!tbody) return;

    this.toggleEmpty('investor-summary-empty', data.length === 0);

    if (data.length === 0) {
        tbody.innerHTML = '';
    } else {
        tbody.innerHTML = data.map((r, index) => `
            <tr class="accordion-parent-row" data-target="inv-${index}">
                <td class="accordion-chevron-cell"><span class="accordion-chevron"><i class="fa-solid fa-chevron-right"></i></span></td>
                <td><strong>${this.escapeHtml(r.investor_name)}</strong></td>
                <td class="text-right"><span class="amount-text">${this.formatCurrency(r.total_amount)}</span></td>
                <td class="text-right">${this.formatNumber(r.total_units)}</td>
            </tr>
            <tr class="nested-table-row hidden" id="inv-${index}">
                <td colspan="4">
                    <div class="nested-table-container">
                        <table class="nested-table">
                            <thead>
                                <tr>
                                    <th>Mutual Fund</th>
                                    <th class="text-right">Amount (₹)</th>
                                    <th class="text-right">Units</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${r.funds.map(f => `
                                    <tr>
                                        <td><span class="fund-tag">${this.escapeHtml(f.mutual_fund)}</span></td>
                                        <td class="text-right"><span class="amount-text">${this.formatCurrency(f.total_amount)}</span></td>
                                        <td class="text-right">${this.formatNumber(f.total_units)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    if (!tbody.dataset.accordionWired) {
        tbody.dataset.accordionWired = 'true';
        tbody.addEventListener('click', (e) => {
            const parentRow = e.target.closest('.accordion-parent-row');
            if (!parentRow) return;
            
            const targetId = parentRow.dataset.target;
            const childRow = document.getElementById(targetId);
            if (childRow) {
                const isExpanded = parentRow.classList.toggle('expanded');
                childRow.classList.toggle('hidden', !isExpanded);
            }
        });
    }

    this.updatePagination('inv', page, data.length);

    const label = document.getElementById('inv-count-label');
    if (label) label.textContent = `Showing page ${page} · ${data.length} records`;
};

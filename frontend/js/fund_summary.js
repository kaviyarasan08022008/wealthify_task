// ═════════════════════════════════════════════════════════════
// FUND SUMMARY (DRILL-DOWN ACCORDION) COMPONENT
// ═════════════════════════════════════════════════════════════

WealthifyApp.prototype.loadFundSummary = async function() {
    const startDate = document.getElementById('fund-start-date')?.value;
    const endDate = document.getElementById('fund-end-date')?.value;
    const page = this.pages.fundSummary;

    this.showSkeleton('fund-summary-tbody', 4, 5);

    if (this.isOffline) {
        this.showOfflineState('fund-summary-tbody', 4);
        return;
    }

    const data = await this.fetchAPI('/fund-summary', {
        start_date: startDate,
        end_date: endDate,
        page,
        limit: this.pageSize,
    });

    if (data === null) {
        this.showOfflineState('fund-summary-tbody', 4);
        return;
    }

    const tbody = document.getElementById('fund-summary-tbody');
    if (!tbody) return;

    this.toggleEmpty('fund-summary-empty', data.length === 0);

    if (data.length === 0) {
        tbody.innerHTML = '';
    } else {
        tbody.innerHTML = data.map((r, index) => `
            <tr class="accordion-parent-row" data-target="fund-${index}">
                <td class="accordion-chevron-cell"><span class="accordion-chevron"><i class="fa-solid fa-chevron-right"></i></span></td>
                <td><strong>${this.escapeHtml(r.mutual_fund)}</strong></td>
                <td class="text-right"><span class="amount-text">${this.formatCurrency(r.total_amount)}</span></td>
                <td class="text-right">${this.formatNumber(r.total_units)}</td>
            </tr>
            <tr class="nested-table-row hidden" id="fund-${index}">
                <td colspan="4">
                    <div class="nested-table-container">
                        <table class="nested-table">
                            <thead>
                                <tr>
                                    <th>Investor Name</th>
                                    <th class="text-right">Amount (₹)</th>
                                    <th class="text-right">Units</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${r.investors.map(inv => `
                                    <tr>
                                        <td>${this.escapeHtml(inv.investor_name)}</td>
                                        <td class="text-right"><span class="amount-text">${this.formatCurrency(inv.amount)}</span></td>
                                        <td class="text-right">${this.formatNumber(inv.units)}</td>
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

    this.updatePagination('fund', page, data.length);

    const label = document.getElementById('fund-count-label');
    if (label) label.textContent = `Showing page ${page} · ${data.length} records`;
};

// ─────────────────────────────────────────────────────────────────
// INITIALIZE THE INSTANCE AT RUNTIME
// ─────────────────────────────────────────────────────────────────
const app = new WealthifyApp();

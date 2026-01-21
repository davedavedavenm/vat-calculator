// App State
const state = {
    vatRate: 20,
    supplierDiscount: 0,
    thresholds: { low: 20, high: 40 }
};

// DOM Elements
const vatRateInput = document.getElementById('vat-rate');
const discountRateInput = document.getElementById('discount-rate');
const rowsContainer = document.getElementById('rows-container');
const addRowBtn = document.getElementById('add-row-btn');
const totalProfitEl = document.getElementById('total-profit');
const totalSalesEl = document.getElementById('total-sales');

// Settings Elements
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const settingHighInput = document.getElementById('setting-high');
const settingLowInput = document.getElementById('setting-low');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initial Load from DOM if present
    state.vatRate = parseFloat(vatRateInput.value) || 20;
    state.supplierDiscount = parseFloat(discountRateInput.value) || 0;

    // Load from LocalStorage (overwrites default if exists)
    loadState();

    // Global Listeners
    vatRateInput.addEventListener('input', (e) => {
        state.vatRate = parseFloat(e.target.value) || 0;
        recalculateAll();
        saveState();
    });

    discountRateInput.addEventListener('input', (e) => {
        state.supplierDiscount = parseFloat(e.target.value) || 0;
        updateUIForDiscount(); // Toggle Columns
        recalculateAll(); // Update calculations
        saveState();
    });

    addRowBtn.addEventListener('click', () => {
        addCalcRow();
        saveState();
        setTimeout(scrollToBottom, 50);
    });

    const copyBtn = document.getElementById('copy-summary-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copySummary);
    }

    // Settings UI Handlers
    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            settingHighInput.value = state.thresholds.high;
            settingLowInput.value = state.thresholds.low;
            settingsModal.classList.remove('hidden');
        });

        closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));

        saveSettingsBtn.addEventListener('click', () => {
            state.thresholds.high = parseFloat(settingHighInput.value) || 40;
            state.thresholds.low = parseFloat(settingLowInput.value) || 20;
            settingsModal.classList.add('hidden');
            recalculateAll();
            saveState();
        });
    }

    updateUIForDiscount(); // Initial Sync
});

// --- Persistence ---
function saveState() {
    const data = {
        vatRate: state.vatRate,
        supplierDiscount: state.supplierDiscount,
        thresholds: state.thresholds,
        rows: []
    };

    document.querySelectorAll('.calc-row').forEach(row => {
        data.rows.push({
            rrp: row.querySelector('.rrp-price').value, // Save RRP
            cost: row.querySelector('.cost-price').value,
            margin: row.querySelector('.margin-input').value,
            sellEx: row.querySelector('.sell-ex-vat').value,
        });
    });

    localStorage.setItem('vatCalcData', JSON.stringify(data));
}

function loadState() {
    const saved = localStorage.getItem('vatCalcData');
    if (!saved) {
        for (let i = 0; i < 7; i++) addCalcRow();
        return;
    }

    try {
        const data = JSON.parse(saved);

        if (data.vatRate) {
            state.vatRate = data.vatRate;
            vatRateInput.value = data.vatRate;
        }

        if (data.supplierDiscount !== undefined) {
            state.supplierDiscount = data.supplierDiscount;
            discountRateInput.value = data.supplierDiscount;
        }

        if (data.thresholds) {
            state.thresholds = data.thresholds;
        }

        if (data.rows && data.rows.length > 0) {
            data.rows.forEach(rowData => {
                const row = addCalcRow();
                // Restore values
                if (rowData.rrp) row.querySelector('.rrp-price').value = rowData.rrp;
                row.querySelector('.cost-price').value = rowData.cost;
                row.querySelector('.margin-input').value = rowData.margin;
                row.querySelector('.sell-ex-vat').value = rowData.sellEx;

                // Simple trigger to ensure correct calculated fields if anything is missing
                // Logic: logic chains are driven by inputs. 
                // If we have SellEx, trigger that to back-calculate Margin (assuming Cost loaded).
                if (rowData.sellEx) {
                    row.querySelector('.sell-ex-vat').dispatchEvent(new Event('input'));
                } else if (rowData.cost) {
                    // If no sell, trigger cost to clear/set downstream
                    row.querySelector('.cost-price').dispatchEvent(new Event('input'));
                }
            });
            
            const currentCount = document.querySelectorAll('.calc-row').length;
            if (currentCount < 7) {
                 for (let i = 0; i < (7 - currentCount); i++) addCalcRow();
            }

        } else {
            for (let i = 0; i < 7; i++) addCalcRow();
        }
    } catch (e) {
        console.error("Failed to load state", e);
        for (let i = 0; i < 7; i++) addCalcRow();
    }
}

// --- Copy Summary ---
function copySummary() {
    let text = `VAT MARGIN QUOTE\n----------------\n`;
    let grandTotal = 0;

    document.querySelectorAll('.calc-row').forEach((row, index) => {
        const sellIncInput = row.querySelector('.sell-inc-vat');
        const price = parseFloat(sellIncInput.value);

        if (price > 0) {
            text += `Item ${index + 1}: ${formatCurrency(price)}\n`;
            grandTotal += price;
        }
    });

    text += `----------------\nTOTAL: ${formatCurrency(grandTotal)}`;

    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copy-summary-btn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<span class="total-label" style="color: var(--success-color);">Copied!</span>';
        setTimeout(() => btn.innerHTML = originalHTML, 1500);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

// Row Template
function createRowHTML(id) {
    return `
        <div class="row-header">
            <span>Item ${id}</span>
            <div class="row-actions">
                <button class="action-btn clear-btn" title="Clear Row">Clear</button>
                <button class="action-btn remove-btn" title="Remove Item">&times;</button>
            </div>
        </div>
        <div class="input-grid">
            <!-- RRP Group (Hidden by default) -->
            <div class="input-group rrp-group hidden">
                <label class="rrp-label">Supplier RRP</label>
                <input type="number" class="rrp-price" placeholder="0.00" step="0.01">
            </div>

            <div class="input-group">
                <label class="cost-label">Supplier Cost (Net)</label>
                <input type="number" class="cost-price" placeholder="0.00" step="0.01">
            </div>
            <div class="input-group">
                <label>Margin %</label>
                <input type="number" class="margin-input" placeholder="0" step="0.1">
            </div>
            <div class="input-group">
                <label>Sell Price (Ex VAT)</label>
                <input type="number" class="sell-ex-vat" placeholder="0.00" step="0.01">
            </div>
            <div class="input-group">
                <label>Sell Price (Inc VAT)</label>
                <input type="number" class="sell-inc-vat" placeholder="0.00" step="0.01">
            </div>
        </div>
        <div class="results-inline">
            <div class="result-box">
                <span class="result-label">VAT Pay</span>
                <span class="result-value vat-payable">-</span>
            </div>
            <div class="result-box">
                <span class="result-label">Net Sales</span>
                <span class="result-value net-sales">-</span>
            </div>
            <div class="result-box profit-item">
                <span class="result-label">Profit</span>
                <span class="result-value profit">-</span>
            </div>
        </div>
    `;
}

// Logic
function addCalcRow() {
    const row = document.createElement('div');
    row.className = 'calc-row';
    const id = document.querySelectorAll('.calc-row').length + 1;
    row.innerHTML = createRowHTML(id);

    // Initial sync of visibility
    toggleRowRRP(row, state.supplierDiscount > 0);

    attachRowListeners(row);

    // Actions
    row.querySelector('.remove-btn').addEventListener('click', () => {
        row.remove();
        updateRowIndices();
        updateGrandTotal();
        saveState();
    });

    row.querySelector('.clear-btn').addEventListener('click', () => {
        row.querySelectorAll('input').forEach(input => input.value = '');
        updateRowResults(row);
        saveState();
    });

    rowsContainer.appendChild(row);
    return row;
}

function updateRowIndices() {
    const rows = document.querySelectorAll('.calc-row');
    rows.forEach((row, index) => {
        row.querySelector('.row-header span').textContent = `Item ${index + 1}`;
    });
}

function scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

function updateUIForDiscount() {
    const showRRP = state.supplierDiscount > 0;
    
    // Toggle class on all rows
    document.querySelectorAll('.calc-row').forEach(row => {
        toggleRowRRP(row, showRRP);
    });

    // Toggle column layout class
    /* We generally update .input-grid to use 5 columns if RRP is shown */
}

function toggleRowRRP(row, show) {
    const rrpGroup = row.querySelector('.rrp-group');
    const inputGrid = row.querySelector('.input-grid');
    const costInput = row.querySelector('.cost-price');

    if (show) {
        rrpGroup.classList.remove('hidden');
        inputGrid.classList.add('has-rrp');
        // When RRP mode is ON, Cost Input becomes a "Calculated/Readonly-ish" field?
        // User asked to "Change nothing else" but also "Separate inputs". 
        // Best UX: Allow editing Cost, but RRP overwrites it. 
        // Ideally make cost visually distinct.
    } else {
        rrpGroup.classList.add('hidden');
        inputGrid.classList.remove('has-rrp');
    }
}

function attachRowListeners(row) {
    const rrpInput = row.querySelector('.rrp-price');
    const costInput = row.querySelector('.cost-price');
    const marginInput = row.querySelector('.margin-input');
    const sellExInput = row.querySelector('.sell-ex-vat');
    const sellIncInput = row.querySelector('.sell-inc-vat');

    // Helper functions
    const getVal = (input) => parseFloat(input.value);
    const save = () => saveState();
    
    // RRP Logic
    // When RRP changes -> Updates Cost. Cost changes -> Updates others.
    rrpInput.addEventListener('input', () => {
        const rrp = getVal(rrpInput);
        if (!isNaN(rrp) && state.supplierDiscount > 0) {
            const calculatedCost = rrp * (1 - (state.supplierDiscount / 100));
            setVal(costInput, calculatedCost);
            // Trigger Cost Logic downstream
            costInput.dispatchEvent(new Event('input')); 
        } else if (isNaN(rrp)) {
            // If RRP cleared, maybe clear cost? Or leave it?
            // Safer to leave cost unless manually cleared.
        }
        save();
    });

    // COST Logic (Standard)
    costInput.addEventListener('input', () => {
        const cost = getVal(costInput); // Raw User Input or Calculated from RRP
        // NOTE: In this new mode, Cost is always the "True Cost". 
        // We do NOT apply discount to this input anymore because the calculation happened upstream (RRP -> Cost).
        
        const margin = getVal(marginInput);
        const sellEx = getVal(sellExInput);

        if (!isNaN(cost)) {
            // Priority 1: Keep Sell Fixed -> Calc Margin
            if (!isNaN(sellEx)) {
                const calculatedMargin = ((sellEx - cost) / sellEx) * 100;
                setVal(marginInput, calculatedMargin);
            }
            // Priority 2: Keep Margin Fixed -> Calc Sell
            else if (!isNaN(margin)) {
                const calculatedSellEx = cost / (1 - (margin / 100));
                setVal(sellExInput, calculatedSellEx);
                setVal(sellIncInput, calculatedSellEx * (1 + (state.vatRate / 100)));
            }
        }
        updateRowResults(row);
        save();
    });

    // MARGIN Logic
    marginInput.addEventListener('input', () => {
        const margin = getVal(marginInput);
        const cost = getVal(costInput);
        const sellEx = getVal(sellExInput);

        if (!isNaN(margin)) {
            if (!isNaN(cost)) {
                const calculatedSellEx = cost / (1 - (margin / 100));
                setVal(sellExInput, calculatedSellEx);
                setVal(sellIncInput, calculatedSellEx * (1 + (state.vatRate / 100)));
            } else if (!isNaN(sellEx)) {
                const calculatedCost = sellEx * (1 - (margin / 100));
                setVal(costInput, calculatedCost);
            }
        }
        updateRowResults(row);
        save();
    });

    // SELL EX Logic
    sellExInput.addEventListener('input', () => {
        const sellEx = getVal(sellExInput);
        const margin = getVal(marginInput);
        const cost = getVal(costInput);

        if (!isNaN(sellEx)) {
            setVal(sellIncInput, sellEx * (1 + (state.vatRate / 100)));
            if (!isNaN(cost)) {
                const calculatedMargin = ((sellEx - cost) / sellEx) * 100;
                setVal(marginInput, calculatedMargin);
            } else if (!isNaN(margin)) {
                const calculatedCost = sellEx * (1 - (margin / 100));
                setVal(costInput, calculatedCost);
            }
        } else {
            sellIncInput.value = '';
        }
        updateRowResults(row);
        save();
    });

    // SELL INC Logic
    sellIncInput.addEventListener('input', () => {
        const sellInc = getVal(sellIncInput);
        if (!isNaN(sellInc)) {
            const calculatedSellEx = sellInc / (1 + (state.vatRate / 100));
            setVal(sellExInput, calculatedSellEx);
            
            // Re-grab SellEx value
            const sellEx = calculatedSellEx;
            const margin = getVal(marginInput);
            const cost = getVal(costInput);

            if (!isNaN(cost)) {
                const calculatedMargin = ((sellEx - cost) / sellEx) * 100;
                setVal(marginInput, calculatedMargin);
            } else if (!isNaN(margin)) {
                const calculatedCost = sellEx * (1 - (margin / 100));
                setVal(costInput, calculatedCost);
            }
        } else {
            sellExInput.value = '';
        }
        updateRowResults(row);
        save();
    });

    // Keyboard (Enter Key) - Adapted for RRP
    row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const target = e.target;

            if (target.classList.contains('rrp-price')) {
                 // RRP -> Cost (Auto calc, but focus move?)
                 // costInput.focus(); 
                 sellIncInput.focus(); // Jump to Sell Inc? Or Cost? Cost is usually auto-calc.
                 sellIncInput.select();
            }
            else if (target.classList.contains('cost-price')) {
                sellIncInput.focus();
                sellIncInput.select();
            } 
            else if (target.classList.contains('margin-input')) {
                sellIncInput.focus();
                sellIncInput.select();
            }
            else if (target.classList.contains('sell-inc-vat')) {
                const nextRow = row.nextElementSibling;
                if (nextRow && nextRow.classList.contains('calc-row')) {
                    // Check mode: if RRP active, go to RRP, else Cost
                    const selector = state.supplierDiscount > 0 ? '.rrp-price' : '.cost-price';
                    const nextInput = nextRow.querySelector(selector);
                    nextInput.focus();
                    nextInput.select();
                } else {
                    const newRow = addCalcRow();
                    saveState();
                    const selector = state.supplierDiscount > 0 ? '.rrp-price' : '.cost-price';
                    const newInput = newRow.querySelector(selector);
                    newInput.focus();
                    newInput.select();
                }
            } 
        }
    });
}

// Helpers
function setVal(inputElement, value, decimals = 2) {
    if (isNaN(value) || !isFinite(value)) {
        inputElement.value = '';
        return;
    }
    inputElement.value = value.toFixed(decimals);
}

function updateRowResults(row) {
    /* 
       PROFIT Calculation Source of Truth:
       Profit = Net Sales (Sell Ex) - Supplier Cost (Net)
       
       In this mode, 'cost-price' input IS the Net Cost.
       Whether it was entered manually OR calculated from RRP, holds the value.
    */
    const costPrice = parseFloat(row.querySelector('.cost-price').value) || 0;
    const sellEx = parseFloat(row.querySelector('.sell-ex-vat').value) || 0;
    const margin = parseFloat(row.querySelector('.margin-input').value) || 0;

    const outputVat = sellEx * (state.vatRate / 100);
    const netSales = sellEx;
    const profit = netSales - costPrice;

    row.querySelector('.vat-payable').textContent = formatCurrency(outputVat);
    row.querySelector('.net-sales').textContent = formatCurrency(netSales);
    row.querySelector('.profit').textContent = formatCurrency(profit);

    const marginInput = row.querySelector('.margin-input');
    const profitItem = row.querySelector('.profit-item');

    marginInput.classList.remove('margin-high', 'margin-med', 'margin-low');

    if (margin >= state.thresholds.high) marginInput.classList.add('margin-high');
    else if (margin >= state.thresholds.low) marginInput.classList.add('margin-med');
    else marginInput.classList.add('margin-low');

    if (profit < 0) {
        profitItem.classList.add('loss');
    } else {
        profitItem.classList.remove('loss');
    }

    updateGrandTotal();
}

function recalculateAll() {
    // If discount changed, we might need to re-run RRP -> Cost logic?
    // Actually, if we change discount rate, we should probably update ALL costs based on RRP if RRP is present?
    // User expectation: "I set discount to 50%. My RRPs stay same. My Costs should drop."
    // Yes.
    
    document.querySelectorAll('.calc-row').forEach(row => {
        const rrp = parseFloat(row.querySelector('.rrp-price').value);
        if (!isNaN(rrp) && state.supplierDiscount > 0) {
            const calculatedCost = rrp * (1 - (state.supplierDiscount / 100));
            // Update cost
            const costInput = row.querySelector('.cost-price');
            setVal(costInput, calculatedCost);
            // This update needs to trigger margin/profit recalc.
            // But we don't want to change Sell Price if it's already set?
            // "Recalculate All" is tricky. Usually "Inputs Drive Outputs".
            // If RRP is driver, Cost is output. Then Profit is output.
        }
        updateRowResults(row);
    });
    updateGrandTotal();
}

function updateGrandTotal() {
    let grandTotalProfit = 0;
    let grandTotalSales = 0;

    document.querySelectorAll('.calc-row').forEach(row => {
        const profitText = row.querySelector('.profit').textContent;
        const sellIncInput = row.querySelector('.sell-inc-vat');

        const profit = parseFloat(profitText.replace(/[£,]/g, '')) || 0;
        const sellInc = parseFloat(sellIncInput.value) || 0;

        grandTotalProfit += profit;
        grandTotalSales += sellInc;
    });

    totalProfitEl.textContent = formatCurrency(grandTotalProfit);
    totalSalesEl.textContent = formatCurrency(grandTotalSales);

    if (grandTotalProfit < 0) {
        totalProfitEl.style.color = 'var(--danger-color)';
    } else {
        totalProfitEl.style.color = 'var(--success-color)';
    }
}

function formatCurrency(val) {
    return '£' + val.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
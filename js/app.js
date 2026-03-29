// Global state
let currentCategory = 'Length';
let supportedUnits = {};

const UNIT_LABELS = {
    'INCH': 'Inches',
    'FEET': 'Feet',
    'YARD': 'Yards',
    'CENTIMETRE': 'Centimetres (cm)',
    'KILOGRAM': 'Kilograms (kg)',
    'GRAM': 'Grams (g)',
    'POUND': 'Pounds (lb)',
    'LITRE': 'Litres',
    'MILLILITRE': 'Millilitres (ml)',
    'GALLON': 'Gallons',
    'CELSIUS': 'Celsius (°C)',
    'FAHRENHEIT': 'Fahrenheit (°F)',
    'KELVIN': 'Kelvin (K)'
};

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    const token = checkAuth();
    if (!token) return;

    await fetchUnits();
    renderUnits(currentCategory);
    await loadHistory();

    // Category Switching Logic
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCategory = tab.dataset.category;
            renderUnits(currentCategory);
        });
    });

    // Operation specific logic
    document.getElementById('operation').addEventListener('change', (e) => {
        const op = e.target.value;
        const targetGroup = document.getElementById('targetUnitGroup');
        if (op === '1') { // Comparison
            targetGroup.style.display = 'none';
        } else {
            targetGroup.style.display = 'block';
        }
    });

    // Handle Form submission
    document.getElementById('measureForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await performAction();
    });
});

async function fetchUnits() {
    try {
        const token = localStorage.getItem('qma_token');
        const response = await fetch(`${CONFIG.API_BASE_URL}/Measurements/units`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            supportedUnits = await response.json();
        } else {
            console.warn('Using fallback units due to API error:', response.status);
            useFallbackUnits();
        }
    } catch (error) {
        console.warn('Using fallback units due to connection error:', error);
        useFallbackUnits();
    } finally {
        renderUnits(currentCategory);
    }
}

function useFallbackUnits() {
    supportedUnits = {
        "Length": ["INCH", "FEET", "YARD", "CENTIMETRE"],
        "Weight": ["KILOGRAM", "GRAM", "POUND"],
        "Volume": ["LITRE", "MILLILITRE", "GALLON"],
        "Temperature": ["CELSIUS", "FAHRENHEIT", "KELVIN"]
    };
}

function renderUnits(category) {
    const unit1 = document.getElementById('unit1');
    const unit2 = document.getElementById('unit2');
    const target = document.getElementById('targetUnit');
    
    // Perform case-insensitive search for category key
    const apiKey = Object.keys(supportedUnits).find(
        key => key.toLowerCase() === category.toLowerCase()
    );
    const units = apiKey ? supportedUnits[apiKey] : [];

    if (units.length === 0) {
        console.warn(`No units found for category: ${category}`);
    }

    const options = units.map(u => `<option value="${u}">${UNIT_LABELS[u] || u}</option>`).join('');
    unit1.innerHTML = options;
    unit2.innerHTML = options;
    target.innerHTML = options;
}

// Perform action (Arithmetic or Comparison)
async function performAction() {
    const btn = document.getElementById('calcBtn');
    const op = parseInt(document.getElementById('operation').value);
    const val1 = parseFloat(document.getElementById('val1').value);
    const unit1 = document.getElementById('unit1').value;
    const val2 = parseFloat(document.getElementById('val2').value);
    const unit2 = document.getElementById('unit2').value;
    const targetUnit = document.getElementById('targetUnit').value;

    const endpoint = op === 1 ? 'compare' : 'calculate';
    
    btn.innerText = 'Processing...';
    btn.disabled = true;

    const payload = {
        measurementCategory: currentCategory,
        operationType: op,
        measurementUnit1: unit1,
        measurementValue1: val1,
        measurementUnit2: unit2,
        measurementValue2: val2,
        targetMeasurementUnit: targetUnit
    };

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Measurements/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('qma_token')}`
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (response.ok) {
            displayResult(result, op);
            await loadHistory();
        } else {
            alert(result.errorMessage || result.title || 'Error processing measurement');
        }
    } catch (error) {
        console.error('Action error:', error);
        alert('Server unreachable');
    } finally {
        btn.innerText = 'Process Measurement';
        btn.disabled = false;
    }
}

function displayResult(result, op) {
    const box = document.getElementById('resultBox');
    const val = document.getElementById('resultValue');
    box.style.display = 'block';

    if (op === 1) { // Comparison
        val.innerHTML = result.areEqual ? '<span style="color: #4ade80;">MATCHED ✓</span>' : '<span style="color: #f87171;">MISMATCHED ✗</span>';
    } else {
        val.innerText = `${result.calculatedValue} ${document.getElementById('targetUnit').value}`;
    }
}

async function loadHistory() {
    const list = document.getElementById('historyList');
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Measurements/history`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('qma_token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.length === 0) {
                list.innerHTML = '<p style="text-align: center; color: #94a3b8; padding-top: 40px;">No history records yet.</p>';
            } else {
                renderHistoryItems(data.reverse());
            }
        }
    } catch (error) {
        console.error('History error:', error);
    }
}

function renderHistoryItems(items) {
    const list = document.getElementById('historyList');
    list.innerHTML = items.map(item => {
        let opSymbol = '=';
        if (item.operationType === 'Add') opSymbol = '+';
        if (item.operationType === 'Subtract') opSymbol = '-';
        if (item.operationType === 'Divide') opSymbol = '/';

        let resultDisplay = item.isComparison ? (item.areEqual ? 'MATCH' : 'MISMATCH') : `${item.calculatedValue} ${item.targetMeasurementUnit}`;

        return `
            <div class="history-item">
                <div class="history-details">
                    <h4 style="color: #cbd5e1; font-size: 14px; margin-bottom: 4px;">${item.measurementCategory}</h4>
                    <p>${item.measurementValue1} ${item.measurementUnit1} ${opSymbol} ${item.measurementValue2} ${item.measurementUnit2}</p>
                    <span style="font-size: 11px; opacity: 0.5;">${new Date(item.createdAt || item.timestamp).toLocaleString()}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div class="history-result" style="font-size: 14px;">${resultDisplay}</div>
                    <button class="delete-btn" onclick="deleteHistory(${item.id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function deleteHistory(id) {
    if (!confirm('Delete this record?')) return;
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Measurements/history/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('qma_token')}`
            }
        });
        if (response.ok) await loadHistory();
    } catch (e) {
        console.log(e);
    }
}

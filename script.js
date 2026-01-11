const form = document.getElementById('lookup-form');
const phoneInput = document.getElementById('phone-input');
const statusEl = document.getElementById('status');
const resultsSection = document.getElementById('results');
const subsList = document.getElementById('subs-list');
const personNameEl = document.getElementById('person-name');
const totalOwedEl = document.getElementById('total-owed');
const payFab = document.getElementById('pay-floating');

const PAYEE_HANDLE = 'parthgupta2008@okicici';
const PAYEE_NAME = 'Parth Gupta';

let subscriptions = [];

document.addEventListener('DOMContentLoaded', () => {
  loadCsv();
  form.addEventListener('submit', handleSubmit);
});

async function loadCsv() {
  try {
    setStatus('Loading subscriptions…');
    const response = await fetch('data/subscriptions.csv');
    if (!response.ok) throw new Error('Failed to load CSV');
    const text = await response.text();
    subscriptions = parseCsv(text);
    setStatus('Ready. Enter your phone number and hit Show dues.');
  } catch (error) {
    console.error(error);
    setStatus('Could not load subscription data. Check data/subscriptions.csv.');
  }
}

function handleSubmit(event) {
  event.preventDefault();
  const phone = normalizePhone(phoneInput.value);

  if (!phone) {
    setStatus('Add a phone number first.');
    hideResults();
    return;
  }

  if (!subscriptions.length) {
    setStatus('Data not loaded yet.');
    hideResults();
    return;
  }

  const matches = subscriptions.filter((row) => phonesMatch(row.phone, phone));

  if (!matches.length) {
    setStatus('No subscriptions found for that number.');
    hideResults();
    return;
  }

  const enriched = matches.map(enrichRow);
  renderResults(enriched);
  setStatus('');
}

function enrichRow(row) {
  const monthlyRaw = row.monthly_amount ?? row.monthly ?? row.amount ?? '0';
  const monthly = Number(monthlyRaw) || 0;
  const lastPaid = row.last_paid ?? row.last_paid_date ?? row.lastPayment ?? '';
  const monthsDue = monthsBehind(lastPaid);
  const paidRaw = row.paid ?? row.amount_paid ?? row.paid_amount ?? '0';
  const paid = Number(paidRaw) || 0;
  const owed = Math.max(0, Math.round(monthly * monthsDue - paid));

  return {
    ...row,
    monthly,
    lastPaid,
    monthsDue,
    paid,
    owed,
  };
}

function renderResults(list) {
  const name = list[0].name || 'Your name';
  personNameEl.textContent = name;

  const total = list.reduce((sum, item) => sum + item.owed, 0);
  totalOwedEl.textContent = formatAmount(total);
  updatePayFab(total);

  subsList.innerHTML = list
    .map(
      (item) => `
        <div class="sub">
          <div>
            <h4>${escapeHtml(item.subscription || 'Subscription')}</h4>
            <p class="small muted">
              Monthly: ${formatAmount(item.monthly)} • Last paid: ${formatDate(item.lastPaid)}
            </p>
            ${item.paid > 0 ? `<p class="small muted">Paid so far: ${formatAmount(item.paid)}</p>` : ''}
          </div>
          <div class="tag">Due: ${formatAmount(item.owed)}</div>
          <p class="small muted">Behind: ${item.monthsDue} month(s)</p>
        </div>
      `
    )
    .join('');

  resultsSection.classList.remove('hidden');
}

function hideResults() {
  resultsSection.classList.add('hidden');
  subsList.innerHTML = '';
  personNameEl.textContent = 'No record yet';
  totalOwedEl.textContent = 'Rs 0';
  payFab.classList.add('hidden');
  form.classList.remove('hidden');
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cells = line.split(',').map((c) => c.trim());
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = cells[index] ?? '';
    });
    rows.push(entry);
  }

  return rows;
}

function monthsBehind(dateStr) {
  if (!dateStr) return 0;
  const paidDate = new Date(dateStr);
  if (Number.isNaN(paidDate.getTime())) return 0;

  const now = new Date();
  const months =
    now.getFullYear() * 12 +
    now.getMonth() -
    (paidDate.getFullYear() * 12 + paidDate.getMonth());

  // Calendar-month based: if you last paid in October, November is the first month owed.
  return Math.max(0, months);
}

function normalizePhone(value) {
  return (value || '').replace(/\D/g, '');
}

function phonesMatch(a, b) {
  const aDigits = normalizePhone(a);
  const bDigits = normalizePhone(b);
  if (!aDigits || !bDigits) return false;

  // Compare last 10 digits so +91xxxxxxxxxx and xxxxxxxxxx both match.
  const aCore = aDigits.slice(-10);
  const bCore = bDigits.slice(-10);
  return aCore === bCore;
}

function formatAmount(value) {
  const rounded = Math.round((Number(value) || 0) * 100) / 100;
  return Number.isInteger(rounded) ? `Rs ${rounded}` : `Rs ${rounded.toFixed(2)}`;
}

function updatePayFab(total) {
  const amount = Math.max(0, Math.round((Number(total) || 0) * 100) / 100);
  const label = amount ? `Pay Rs ${amount}` : 'Pay now';
  payFab.textContent = label;
  payFab.href = buildUpiLink(amount);
  payFab.classList.remove('hidden');
}

function buildUpiLink(amount) {
  const params = new URLSearchParams({
    pa: PAYEE_HANDLE,
    pn: PAYEE_NAME,
    am: amount || '',
    cu: 'INR',
  });
  return `upi://pay?${params.toString()}`;
}

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function setStatus(message) {
  statusEl.textContent = message;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const API_URL = `${API_BASE_URL}/stock-transactions`;
const tableBody = document.getElementById("tableBody");
const searchInput = document.getElementById("searchInput");
const reloadBtn = document.getElementById("reloadBtn");
const applyFilter = document.getElementById("applyFilter");
const fromDate = document.getElementById("fromDate");
const toDate = document.getElementById("toDate");
const locationSelect = document.getElementById("locationSelect");

let allData = [];

async function fetchTransactions() {
  try {
    showLoading();
    const res = await fetch(API_URL, { headers: { Accept: "application/json" } });
    const data = await res.json();
    allData = data || [];
    applyFilters();
  } catch (err) {
    console.error("Error fetching transactions:", err);
    showError("Failed to load transactions");
    allData = [];
    renderTable([]);
  } finally {
    hideLoading();
  }
}

function applyFilters() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const location = locationSelect.value;
  const from = fromDate.value;
  const to = toDate.value;

  let filteredData = allData.filter(item => {
    // Search filter
    const matchesSearch = !searchTerm || 
      safe(item.productVariant).toLowerCase().includes(searchTerm) ||
      safe(item.sku).toLowerCase().includes(searchTerm) ||
      safe(item.barcode).toLowerCase().includes(searchTerm);

    // Location filter
    const matchesLocation = !location || 
      (item.location && item.location === location);

    // Date filter
    const itemDate = new Date(item.time).toISOString().split('T')[0];
    const matchesFrom = !from || itemDate >= from;
    const matchesTo = !to || itemDate <= to;

    return matchesSearch && matchesLocation && matchesFrom && matchesTo;
  });

  renderTable(filteredData);
}

function renderTable(data) {
  tableBody.innerHTML = "";

  if (data.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td colspan="13" class="no-data">
        <i class="fas fa-inbox"></i>
        <span>No transactions found</span>
      </td>
    `;
    tableBody.appendChild(row);
    return;
  }

  data.forEach(item => {
    const reserved = toInt(item.reserved);
    const buffer = toInt(item.buffer);
    const available = toInt(item.available);

    const row = document.createElement("tr");
    row.innerHTML = `
      <!-- Product -->
      <td class="pv">
        <img src="${item.imageUrl}" alt="${item.productVariant}" class="product-img">
        <span>${safe(item.productVariant)}</span>
      </td>

      <!-- SKU -->
      <td><span class="sku">${safe(item.sku)}</span></td>

      <!-- Barcode -->
      <td><span class="barcode">${safe(item.barcode)}</span></td>

      <!-- Time -->
      <td><span class="time">${formatTime(item.time)}</span></td>

      <!-- Quantity -->
      <td class="num">${fmtInt(item.quantity)}</td>

      <!-- Reserved -->
      <td class="stock-numbers">
        <span class="main-value ${reserved > 0 ? 'available-warning' : 'available-negative'}">
          ${fmtInt(reserved)}
        </span>
      </td>

      <!-- Buffer -->
      <td class="stock-numbers">
        <span class="main-value">${fmtInt(buffer)}</span>
      </td>

      <!-- Available -->
      <td class="stock-numbers">
        <span class="main-value ${getAvailableClass(available)}">${fmtInt(available)}</span>
      </td>

      <!-- Purchase Price -->
      <td class="num">${formatCurrency(item.purchasePrice)}</td>

      <!-- Retail Price -->
      <td class="num">${formatCurrency(item.retailPrice)}</td>

      <!-- Agent -->
      <td><span class="agent">${safe(item.agent || "System")}</span></td>
    `;
    tableBody.appendChild(row);
  });
}


// Hàm xác định class cho cột Available dựa trên giá trị
function getAvailableClass(available) {
  if (available > 100) return 'available-positive';
  if (available <= 0) return 'available-negative';
  return 'available-warning';
}

// Cập nhật hàm toInt để xử lý số âm
function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

// Utility functions
function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function fmtInt(n) {
  return new Intl.NumberFormat("vi-VN").format(n || 0);
}

function formatCurrency(value) {
  const n = Number(value);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number.isFinite(n) ? n : 0);
}

function formatTime(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "-";
  const day = d.toLocaleDateString("en-US", { weekday: "short" });
  const date = d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour12: false });
  return `${day}, ${date} - ${time}`;
}

function safe(s) {
  return (s ?? "").toString().replace(/[<>&]/g, c => ({ "<":"&lt;", ">":"&gt;", "&":"&amp;" }[c]));
}

// Loading states
function showLoading() {
  tableBody.innerHTML = `
    <tr>
      <td colspan="11" class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Loading transactions...</span>
      </td>
    </tr>
  `;
}

function hideLoading() {
  // Loading state will be replaced by renderTable
}

function showError(message) {
  tableBody.innerHTML = `
    <tr>
      <td colspan="11" class="error">
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
      </td>
    </tr>
  `;
}

// Event listeners
applyFilter.addEventListener("click", applyFilters);
reloadBtn.addEventListener("click", fetchTransactions);
searchInput.addEventListener("input", debounce(applyFilters, 300));

// Debounce function for search
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  fetchTransactions();
  
  // Set default dates to current month
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  fromDate.value = firstDay.toISOString().split('T')[0];
  toDate.value = lastDay.toISOString().split('T')[0];
});
// Shahboz Calculator - State Management & Logic

// State
let currentMode = localStorage.getItem('shahboz_active_mode') || 'ali';
let products = [];
let purchaseHistory = [];

// DOM Elements
const switchModeBtn = document.getElementById('switchModeBtn');
const switchModeBtnText = document.getElementById('switchModeBtnText');
const calcCardTitle = document.getElementById('calcCardTitle');
const productSelect = document.getElementById('productSelect');
const purchaseDateInput = document.getElementById('purchaseDateInput');
const btnDatePrev = document.getElementById('btnDatePrev');
const btnDateNext = document.getElementById('btnDateNext');
const unitPriceDisplay = document.getElementById('unitPriceDisplay');
const qtyInput = document.getElementById('qtyInput');
const btnMinus = document.getElementById('btnMinus');
const btnPlus = document.getElementById('btnPlus');
const itemSubtotalDisplay = document.getElementById('itemSubtotalDisplay');
const addPurchaseForm = document.getElementById('addPurchaseForm');
const historyList = document.getElementById('historyList');
const emptyHistoryState = document.getElementById('emptyHistoryState');
const totalItemsCount = document.getElementById('totalItemsCount');
const grandTotalDisplay = document.getElementById('grandTotalDisplay');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const sendWhatsAppBtn = document.getElementById('sendWhatsAppBtn');
const catalogCountBadge = document.getElementById('catalogCountBadge');

// Catalog Modal Elements
const catalogModal = document.getElementById('catalogModal');
const openCatalogBtn = document.getElementById('openCatalogBtn');
const quickAddProductBtn = document.getElementById('quickAddProductBtn');
const closeCatalogBtn = document.getElementById('closeCatalogBtn');
const productForm = document.getElementById('productForm');
const newProductName = document.getElementById('newProductName');
const newProductPrice = document.getElementById('newProductPrice');
const editingProductId = document.getElementById('editingProductId');
const saveProductBtnText = document.getElementById('saveProductBtnText');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const catalogProductsList = document.getElementById('catalogProductsList');
const emptyCatalogState = document.getElementById('emptyCatalogState');

// Product History Modal Elements
const productHistoryModal = document.getElementById('productHistoryModal');
const itemHistoryModalTitle = document.getElementById('itemHistoryModalTitle');
const itemHistoryModalSubtitle = document.getElementById('itemHistoryModalSubtitle');
const closeProductHistoryBtn = document.getElementById('closeProductHistoryBtn');
const productHistoryLogsList = document.getElementById('productHistoryLogsList');

const toast = document.getElementById('toast');

// Format Currency (whole integer without ,00)
function formatMoney(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 ₽';
  const num = Number(amount);
  const isInteger = Number.isInteger(num) || (num % 1 === 0);
  const formatted = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: isInteger ? 0 : 2,
    maximumFractionDigits: 2
  }).format(num);
  return `${formatted} ₽`;
}

// Format Date & Time
function formatDateTime(isoString) {
  if (!isoString) return { date: '', time: '', isoDate: '' };
  const d = new Date(isoString);
  const date = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const isoDate = `${year}-${month}-${day}`;
  return { date, time, isoDate };
}

// Default Catalogs for Profiles
const defaultProductsAli = [
  { id: 'prod_joystick', name: 'Джойстик', price: 450 },
  { id: 'prod_air4', name: 'Аир 4', price: 400 },
  { id: 'prod_pro2', name: 'Про 2', price: 400 },
  { id: 'prod_straightener_case', name: 'Выпрямитель с кейсом', price: 3900 },
  { id: 'prod_magsafe', name: 'Magsafe', price: 120 },
  { id: 'prod_case_headphones', name: 'Чехол наушники', price: 50 },
  { id: 'prod_straightener_nologo', name: 'Выпрямитель без лого', price: 2000 },
  { id: 'prod_120w', name: '120в', price: 140 },
  { id: 'prod_45w', name: '45в', price: 170 },
  { id: 'prod_200w', name: '200в', price: 230 },
  { id: 'prod_67w', name: '67в', price: 130 },
  { id: 'prod_33w', name: '33в', price: 120 }
];

const defaultProductsRavshan = [
  { id: 'rav_sbor50', name: 'Сборка', price: 50 },
  { id: 'rav_sbor150', name: 'Сборка', price: 150 },
  { id: 'rav_sbor200', name: 'Сборка', price: 200 },
  { id: 'rav_dost150', name: 'Доставка', price: 150 },
  { id: 'rav_dost300', name: 'Доставка', price: 300 },
  { id: 'rav_dost450', name: 'Доставка', price: 450 },
  { id: 'rav_dost600', name: 'Доставка', price: 600 }
];

// Profile storage keys & meta
function getStorageKeys() {
  if (currentMode === 'ravshan') {
    return {
      productsKey: 'shahboz_products_ravshan',
      historyKey: 'shahboz_history_ravshan',
      defaultProducts: defaultProductsRavshan,
      modeName: 'Равшан ФБС',
      nextModeName: 'Али ФБС'
    };
  } else {
    return {
      productsKey: 'shahboz_products_ali',
      historyKey: 'shahboz_history_ali',
      defaultProducts: defaultProductsAli,
      modeName: 'Али ФБС',
      nextModeName: 'Равшан ФБС'
    };
  }
}

// LocalStorage helpers
function loadState() {
  try {
    // Migration from old keys
    if (!localStorage.getItem('shahboz_products_ali') && localStorage.getItem('shahboz_products')) {
      localStorage.setItem('shahboz_products_ali', localStorage.getItem('shahboz_products'));
    }
    if (!localStorage.getItem('shahboz_history_ali') && localStorage.getItem('shahboz_history')) {
      localStorage.setItem('shahboz_history_ali', localStorage.getItem('shahboz_history'));
    }

    const { productsKey, historyKey, defaultProducts } = getStorageKeys();

    // 1. Load History first
    const savedHistory = localStorage.getItem(historyKey);
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory);
      purchaseHistory = Array.isArray(parsedHistory) ? parsedHistory : [];
    } else {
      purchaseHistory = [];
    }

    // Clean Ravshan names in history
    if (currentMode === 'ravshan') {
      purchaseHistory.forEach(item => {
        if (item.productName && item.productName.toLowerCase().startsWith('сборка')) item.productName = 'Сборка';
        if (item.productName && item.productName.toLowerCase().startsWith('доставка')) item.productName = 'Доставка';
      });
    }

    // 2. Load Products
    const savedProducts = localStorage.getItem(productsKey);
    if (savedProducts) {
      products = JSON.parse(savedProducts);
      if (!Array.isArray(products) || products.length === 0) {
        products = [...defaultProducts];
      } else {
        // Clean Ravshan names in products catalog
        if (currentMode === 'ravshan') {
          products.forEach(p => {
            if (p.name && p.name.toLowerCase().startsWith('сборка')) p.name = 'Сборка';
            if (p.name && p.name.toLowerCase().startsWith('доставка')) p.name = 'Доставка';
          });
        }
        // Merge missing default products
        defaultProducts.forEach(def => {
          if (!products.some(p => p.id === def.id || (p.name.trim().toLowerCase() === def.name.trim().toLowerCase() && p.price === def.price))) {
            products.push({ ...def });
          }
        });
      }
    } else {
      products = [...defaultProducts];
    }

    // 3. Save state safely
    saveState();
  } catch (e) {
    console.error('Error loading state from localStorage:', e);
    const { defaultProducts } = getStorageKeys();
    products = [...defaultProducts];
    purchaseHistory = [];
  }
}

function saveState() {
  try {
    const { productsKey, historyKey } = getStorageKeys();
    localStorage.setItem(productsKey, JSON.stringify(products));
    localStorage.setItem(historyKey, JSON.stringify(purchaseHistory));
  } catch (e) {
    console.error('Error saving state to localStorage:', e);
  }
}

function updateModeUI() {
  const { nextModeName } = getStorageKeys();
  if (switchModeBtnText) {
    switchModeBtnText.textContent = nextModeName;
  }
}

function toggleMode() {
  currentMode = (currentMode === 'ali') ? 'ravshan' : 'ali';
  localStorage.setItem('shahboz_active_mode', currentMode);
  loadState();
  updateModeUI();
  renderProducts();
  renderHistory();
  const { modeName } = getStorageKeys();
  showToast(`Режим переключен: ${modeName}`);
}

// Show Toast notification
let toastTimeout;
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// Render Products in Dropdown and Modal
function renderProducts() {
  if (catalogCountBadge) catalogCountBadge.textContent = products.length;

  // Dropdown options
  const currentVal = productSelect.value;
  productSelect.innerHTML = '';

  if (products.length === 0) {
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    defaultOption.textContent = '— Каталог пуст, добавьте товар —';
    productSelect.appendChild(defaultOption);
    if (unitPriceDisplay) unitPriceDisplay.textContent = '0 ₽';
  } else {
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.disabled = true;
    placeholderOption.selected = !currentVal;
    placeholderOption.textContent = '— Выберите товар —';
    productSelect.appendChild(placeholderOption);

    products.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name} (${formatMoney(p.price)})`;
      if (p.id === currentVal) {
        opt.selected = true;
      }
      productSelect.appendChild(opt);
    });
  }

  // Modal Catalog List
  catalogProductsList.innerHTML = '';
  if (products.length === 0) {
    emptyCatalogState.style.display = 'block';
  } else {
    emptyCatalogState.style.display = 'none';
    products.forEach(p => {
      const li = document.createElement('li');
      li.className = 'catalog-item';
      li.innerHTML = `
        <div>
          <div class="catalog-item-name">${escapeHtml(p.name)}</div>
          <div class="catalog-item-price">${formatMoney(p.price)}</div>
        </div>
        <div class="catalog-item-actions">
          <button class="btn-icon" title="Редактировать" onclick="editProduct('${p.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn-icon text-danger" title="Удалить" onclick="deleteProduct('${p.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;
      catalogProductsList.appendChild(li);
    });
  }

  updateSubtotal();
}

// Escape HTML for XSS prevention
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Get selected product object
function getSelectedProduct() {
  const id = productSelect.value;
  return products.find(p => p.id === id) || null;
}

// Update calculated subtotal
function updateSubtotal() {
  const selected = getSelectedProduct();
  const qty = parseFloat(qtyInput.value) || 0;

  if (selected) {
    if (unitPriceDisplay) unitPriceDisplay.textContent = formatMoney(selected.price);
    const subtotal = selected.price * qty;
    itemSubtotalDisplay.textContent = formatMoney(subtotal);
  } else {
    if (unitPriceDisplay) unitPriceDisplay.textContent = '0 ₽';
    itemSubtotalDisplay.textContent = '0 ₽';
  }
}

// Group Purchase History by Product (no duplicates)
function getGroupedHistory() {
  const groupsMap = new Map();
  purchaseHistory.forEach(item => {
    if (!groupsMap.has(item.productId)) {
      groupsMap.set(item.productId, {
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        totalQty: 0,
        totalPrice: 0,
        entriesCount: 0,
        entries: []
      });
    }
    const group = groupsMap.get(item.productId);
    group.totalQty += item.qty;
    group.totalPrice += item.total;
    group.entriesCount += 1;
    group.entries.push(item);
  });
  return Array.from(groupsMap.values());
}

// Render Purchase History & Grand Total
function renderHistory() {
  historyList.innerHTML = '';

  if (purchaseHistory.length === 0) {
    emptyHistoryState.style.display = 'flex';
    clearHistoryBtn.style.display = 'none';
    if (sendWhatsAppBtn) sendWhatsAppBtn.style.display = 'none';
    if (totalItemsCount) totalItemsCount.textContent = '0 поз.';
    grandTotalDisplay.textContent = '0 ₽';
    return;
  }

  emptyHistoryState.style.display = 'none';
  clearHistoryBtn.style.display = 'inline-flex';
  if (sendWhatsAppBtn) sendWhatsAppBtn.style.display = 'inline-flex';

  const grouped = getGroupedHistory();
  let grandTotal = 0;
  let totalQty = 0;

  grouped.forEach(item => {
    grandTotal += item.totalPrice;
    totalQty += item.totalQty;

    const li = document.createElement('li');
    li.className = 'history-item clickable';
    li.title = 'Нажмите, чтобы посмотреть историю добавлений этого товара';
    li.onclick = () => openProductHistoryModal(item.productId);
    li.innerHTML = `
      <div class="item-info">
        <span class="item-title">${escapeHtml(item.productName)}</span>
        <span class="item-calc-details">${formatMoney(item.unitPrice)} × ${item.totalQty} шт.</span>
      </div>
      <div class="item-actions-group">
        <span class="item-total-price">${formatMoney(item.totalPrice)}</span>
        <button class="btn-icon-delete" title="Удалить из чека" onclick="event.stopPropagation(); removeGroupFromHistory('${item.productId}')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;
    historyList.appendChild(li);
  });

  if (totalItemsCount) totalItemsCount.textContent = `${grouped.length} тов. (${totalQty} шт.)`;
  grandTotalDisplay.textContent = formatMoney(grandTotal);
}

// Product History Modal (detailed additions with editable date/time & quantity)
window.openProductHistoryModal = function(productId) {
  const entries = purchaseHistory.filter(item => item.productId === productId);
  if (entries.length === 0) return;

  const productName = entries[0].productName;
  const totalQty = entries.reduce((sum, e) => sum + e.qty, 0);
  const totalPrice = entries.reduce((sum, e) => sum + e.total, 0);

  itemHistoryModalTitle.textContent = productName;
  itemHistoryModalSubtitle.textContent = `Всего: ${totalQty} шт. на сумму ${formatMoney(totalPrice)}`;

  productHistoryLogsList.innerHTML = '';
  entries.forEach(entry => {
    const { time, isoDate } = formatDateTime(entry.timestamp);
    const li = document.createElement('li');
    li.className = 'history-log-item';
    li.innerHTML = `
      <div class="log-main-col">
        <div class="log-top-row">
          <div class="log-date-control">
            <span class="log-date-icon">📅</span>
            <input type="date" class="log-date-input" value="${isoDate}" onchange="updateLogEntryDate('${entry.id}', '${entry.productId}', this.value)" title="Изменить дату">
            <span class="log-time">🕒 ${time}</span>
          </div>
          <button class="btn-icon-delete" title="Удалить это добавление" onclick="removeSingleLogEntry('${entry.id}', '${entry.productId}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="log-bottom-row">
          <div class="log-calc-info">
            ${formatMoney(entry.unitPrice)} × ${entry.qty} шт. = <strong class="log-calc-total">${formatMoney(entry.total)}</strong>
          </div>
          <div class="log-qty-control">
            <button type="button" class="log-qty-btn" title="Уменьшить на 1" onclick="changeLogQty('${entry.id}', '${entry.productId}', -1)">−</button>
            <input type="number" class="log-qty-input" min="1" step="1" value="${entry.qty}" onchange="setLogQty('${entry.id}', '${entry.productId}', this.value)" title="Количество">
            <button type="button" class="log-qty-btn" title="Увеличить на 1" onclick="changeLogQty('${entry.id}', '${entry.productId}', 1)">+</button>
            <span class="log-qty-unit">шт.</span>
          </div>
        </div>
      </div>
    `;
    productHistoryLogsList.appendChild(li);
  });

  productHistoryModal.classList.add('active');
  productHistoryModal.setAttribute('aria-hidden', 'false');
};

// Update Date of a single log entry
window.updateLogEntryDate = function(logId, productId, newDateVal) {
  if (!newDateVal) return;
  const entry = purchaseHistory.find(e => e.id === logId);
  if (!entry) return;

  const oldDate = entry.timestamp ? new Date(entry.timestamp) : new Date();
  const [y, m, d] = newDateVal.split('-').map(Number);
  const newDateObj = new Date(y, m - 1, d, oldDate.getHours(), oldDate.getMinutes(), oldDate.getSeconds());
  entry.timestamp = newDateObj.toISOString();

  saveState();
  renderHistory();
  openProductHistoryModal(productId);
  showToast('Дата записи обновлена');
};

// Change Quantity by delta (+1 / -1)
window.changeLogQty = function(logId, productId, delta) {
  const entry = purchaseHistory.find(e => e.id === logId);
  if (!entry) return;

  const currentQty = parseFloat(entry.qty) || 1;
  const newQty = Math.max(1, currentQty + delta);
  if (newQty === currentQty) return;

  entry.qty = newQty;
  entry.total = entry.unitPrice * newQty;

  saveState();
  renderHistory();
  openProductHistoryModal(productId);
};

// Set Quantity directly
window.setLogQty = function(logId, productId, rawVal) {
  const entry = purchaseHistory.find(e => e.id === logId);
  if (!entry) return;

  let newQty = parseFloat(rawVal);
  if (isNaN(newQty) || newQty < 1) newQty = 1;

  entry.qty = newQty;
  entry.total = entry.unitPrice * newQty;

  saveState();
  renderHistory();
  openProductHistoryModal(productId);
};

function closeProductHistoryModal() {
  productHistoryModal.classList.remove('active');
  productHistoryModal.setAttribute('aria-hidden', 'true');
}

// Remove single log entry
window.removeSingleLogEntry = function(logId, productId) {
  const entryIdx = purchaseHistory.findIndex(e => e.id === logId);
  if (entryIdx === -1) return;

  const removed = purchaseHistory[entryIdx];
  purchaseHistory.splice(entryIdx, 1);
  saveState();
  renderHistory();

  const remaining = purchaseHistory.filter(e => e.productId === productId);
  if (remaining.length > 0) {
    openProductHistoryModal(productId);
  } else {
    closeProductHistoryModal();
  }
  showToast(`Удалена запись: -${removed.qty} шт.`);
};

// Remove entire product group from history
window.removeGroupFromHistory = function(productId) {
  const entries = purchaseHistory.filter(e => e.productId === productId);
  const name = entries.length > 0 ? entries[0].productName : 'товар';
  
  if (confirm(`Удалить все добавления "${name}" из чека?`)) {
    purchaseHistory = purchaseHistory.filter(e => e.productId !== productId);
    saveState();
    renderHistory();
    closeProductHistoryModal();
    showToast(`Товар "${name}" удален из чека`);
  }
};

// Product Management (CRUD)
window.editProduct = function(id) {
  const prod = products.find(p => p.id === id);
  if (!prod) return;

  editingProductId.value = prod.id;
  newProductName.value = prod.name;
  newProductPrice.value = prod.price;
  saveProductBtnText.textContent = 'Сохранить изменения';
  cancelEditBtn.style.display = 'inline-flex';
  newProductName.focus();
};

window.deleteProduct = function(id) {
  const prod = products.find(p => p.id === id);
  if (!prod) return;

  if (confirm(`Удалить товар "${prod.name}" из каталога?`)) {
    products = products.filter(p => p.id !== id);
    if (editingProductId.value === id) {
      resetProductForm();
    }
    saveState();
    renderProducts();
    showToast(`Товар "${prod.name}" удален`);
  }
};

function resetProductForm() {
  editingProductId.value = '';
  newProductName.value = '';
  newProductPrice.value = '';
  saveProductBtnText.textContent = 'Добавить товар';
  cancelEditBtn.style.display = 'none';
}

function handleProductFormSubmit(e) {
  e.preventDefault();
  const name = newProductName.value.trim();
  const price = parseFloat(newProductPrice.value);

  if (!name) {
    showToast('Введите название товара');
    return;
  }
  if (isNaN(price) || price < 0) {
    showToast('Введите корректную цену');
    return;
  }

  const editId = editingProductId.value;
  if (editId) {
    // Update existing
    const idx = products.findIndex(p => p.id === editId);
    if (idx !== -1) {
      products[idx].name = name;
      products[idx].price = price;
      showToast(`Товар "${name}" обновлен`);
    }
  } else {
    // Create new
    const newProd = {
      id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: name,
      price: price
    };
    products.push(newProd);
    showToast(`Товар "${name}" добавлен в каталог`);
    
    // Auto-select the newly created product
    setTimeout(() => {
      productSelect.value = newProd.id;
      updateSubtotal();
    }, 50);
  }

  resetProductForm();
  saveState();
  renderProducts();
}

// Helper to set today's date in date input
function setTodayDate() {
  if (!purchaseDateInput) return;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  purchaseDateInput.value = `${year}-${month}-${day}`;
}

// Change date by +/- days
function changePurchaseDate(daysDelta) {
  if (!purchaseDateInput) return;
  let val = purchaseDateInput.value;
  let dateObj;
  if (val) {
    const [y, m, d] = val.split('-').map(Number);
    dateObj = new Date(y, m - 1, d);
  } else {
    dateObj = new Date();
  }
  dateObj.setDate(dateObj.getDate() + daysDelta);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  purchaseDateInput.value = `${year}-${month}-${day}`;
}

// Add Item to History
function handleAddPurchase(e) {
  e.preventDefault();
  const selected = getSelectedProduct();
  if (!selected) {
    showToast('Пожалуйста, выберите товар из списка');
    return;
  }

  const qty = parseFloat(qtyInput.value);
  if (isNaN(qty) || qty <= 0) {
    showToast('Укажите корректное количество');
    return;
  }

  const total = selected.price * qty;

  // Build timestamp from selected date and current time
  const selectedDateVal = purchaseDateInput ? purchaseDateInput.value : '';
  let timestamp;
  if (selectedDateVal) {
    const now = new Date();
    const [y, m, d] = selectedDateVal.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
    timestamp = dateObj.toISOString();
  } else {
    timestamp = new Date().toISOString();
  }

  const historyEntry = {
    id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    productId: selected.id,
    productName: selected.name,
    unitPrice: selected.price,
    qty: qty,
    total: total,
    timestamp: timestamp
  };

  purchaseHistory.unshift(historyEntry);
  saveState();
  renderHistory();
  showToast(`Добавлено: ${selected.name} (+${qty} шт.)`);

  // Reset quantity back to 1
  qtyInput.value = '1';
  updateSubtotal();
}

// Clear entire history
function handleClearHistory() {
  if (purchaseHistory.length === 0) return;
  if (confirm('Очистить всю историю текущей закупки?')) {
    purchaseHistory = [];
    saveState();
    renderHistory();
    closeProductHistoryModal();
    showToast('История закупки очищена');
  }
}

// Generate Receipt Text (grouped by date)
function generateReceiptText() {
  if (purchaseHistory.length === 0) return '';

  // Group entries by date
  const dateGroups = new Map();

  purchaseHistory.forEach(entry => {
    let dateStr = '';
    let dateShort = '';
    if (entry.timestamp) {
      const d = new Date(entry.timestamp);
      dateStr = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
      dateShort = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    } else {
      const d = new Date();
      dateStr = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
      dateShort = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    }

    if (!dateGroups.has(dateStr)) {
      dateGroups.set(dateStr, {
        dateStr,
        dateShort,
        productsMap: new Map(),
        firstTimestamp: entry.timestamp || new Date().toISOString()
      });
    }

    const dayGroup = dateGroups.get(dateStr);
    if (!dayGroup.productsMap.has(entry.productId)) {
      dayGroup.productsMap.set(entry.productId, {
        productId: entry.productId,
        productName: entry.productName,
        unitPrice: entry.unitPrice,
        totalQty: 0,
        totalPrice: 0
      });
    }

    const prod = dayGroup.productsMap.get(entry.productId);
    prod.totalQty += entry.qty;
    prod.totalPrice += entry.total;
  });

  // Sort dates chronologically
  const sortedDates = Array.from(dateGroups.values()).sort((a, b) => {
    return new Date(a.firstTimestamp) - new Date(b.firstTimestamp);
  });

  const { modeName } = getStorageKeys();
  let text = `🧾 ЧЕК ЗАКУПКИ (${modeName})\n`;
  text += '-------------------------------\n';
  let grandTotal = 0;

  sortedDates.forEach((dayGroup, groupIdx) => {
    text += `📅 ${dayGroup.dateStr}\n`;
    let dayTotal = 0;
    let itemIdx = 1;

    dayGroup.productsMap.forEach(item => {
      text += `${itemIdx}. ${item.productName} — ${item.totalQty} шт. × ${formatMoney(item.unitPrice)} = ${formatMoney(item.totalPrice)}\n`;
      dayTotal += item.totalPrice;
      itemIdx++;
    });

    text += `   Сумма за ${dayGroup.dateShort}: ${formatMoney(dayTotal)}\n`;
    grandTotal += dayTotal;

    if (groupIdx < sortedDates.length - 1) {
      text += '\n';
    }
  });

  text += '-------------------------------\n';
  text += `ИТОГО К ОПЛАТЕ: ${formatMoney(grandTotal)}`;
  return text;
}

// Send to WhatsApp
function handleSendWhatsApp() {
  const text = generateReceiptText();
  if (!text) return;

  // Copy to clipboard in background as backup
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  showToast('Открываем WhatsApp...');

  // Open WhatsApp with prefilled message
  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(waUrl, '_blank');
}

// Modal handling
function openModal() {
  catalogModal.classList.add('active');
  catalogModal.setAttribute('aria-hidden', 'false');
  newProductName.focus();
}

function closeModal() {
  catalogModal.classList.remove('active');
  catalogModal.setAttribute('aria-hidden', 'true');
  resetProductForm();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateModeUI();
  setTodayDate();
  renderProducts();
  renderHistory();

  // Mode Switch
  if (switchModeBtn) {
    switchModeBtn.addEventListener('click', toggleMode);
  }

  // Date Prev / Next Buttons
  if (btnDatePrev) {
    btnDatePrev.addEventListener('click', () => changePurchaseDate(-1));
  }
  if (btnDateNext) {
    btnDateNext.addEventListener('click', () => changePurchaseDate(1));
  }

  // Dropdown Change
  productSelect.addEventListener('change', updateSubtotal);

  // Quantity input and buttons
  qtyInput.addEventListener('input', updateSubtotal);
  
  btnMinus.addEventListener('click', () => {
    let val = parseFloat(qtyInput.value) || 1;
    if (val > 1) {
      qtyInput.value = val - 1;
      updateSubtotal();
    }
  });

  btnPlus.addEventListener('click', () => {
    let val = parseFloat(qtyInput.value) || 0;
    qtyInput.value = val + 1;
    updateSubtotal();
  });

  // Forms
  addPurchaseForm.addEventListener('submit', handleAddPurchase);
  productForm.addEventListener('submit', handleProductFormSubmit);
  cancelEditBtn.addEventListener('click', resetProductForm);
  clearHistoryBtn.addEventListener('click', handleClearHistory);
  if (sendWhatsAppBtn) sendWhatsAppBtn.addEventListener('click', handleSendWhatsApp);

  // Catalog Modal open/close
  openCatalogBtn.addEventListener('click', openModal);
  quickAddProductBtn.addEventListener('click', openModal);
  closeCatalogBtn.addEventListener('click', closeModal);

  // Product History Modal close
  closeProductHistoryBtn.addEventListener('click', closeProductHistoryModal);

  catalogModal.addEventListener('click', (e) => {
    if (e.target === catalogModal) {
      closeModal();
    }
  });

  productHistoryModal.addEventListener('click', (e) => {
    if (e.target === productHistoryModal) {
      closeProductHistoryModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (catalogModal.classList.contains('active')) closeModal();
      if (productHistoryModal.classList.contains('active')) closeProductHistoryModal();
    }
  });
});

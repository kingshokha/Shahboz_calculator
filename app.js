// Shahboz Calculator - State Management & Logic

// State
let products = [];
let purchaseHistory = [];

// DOM Elements
const productSelect = document.getElementById('productSelect');
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
const copyReceiptBtn = document.getElementById('copyReceiptBtn');
const catalogCountBadge = document.getElementById('catalogCountBadge');

// Modal Elements
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
const toast = document.getElementById('toast');

// Format Currency
function formatMoney(amount) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2
  }).format(amount).replace('₽', '').trim() + ' ₽';
}

// LocalStorage helpers
function loadState() {
  try {
    const savedProducts = localStorage.getItem('shahboz_products');
    products = savedProducts ? JSON.parse(savedProducts) : [];

    const savedHistory = localStorage.getItem('shahboz_history');
    purchaseHistory = savedHistory ? JSON.parse(savedHistory) : [];
  } catch (e) {
    console.error('Error loading state from localStorage:', e);
    products = [];
    purchaseHistory = [];
  }
}

function saveState() {
  try {
    localStorage.setItem('shahboz_products', JSON.stringify(products));
    localStorage.setItem('shahboz_history', JSON.stringify(purchaseHistory));
  } catch (e) {
    console.error('Error saving state to localStorage:', e);
  }
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
  catalogCountBadge.textContent = products.length;

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

// Render Purchase History & Grand Total
function renderHistory() {
  historyList.innerHTML = '';

  if (purchaseHistory.length === 0) {
    emptyHistoryState.style.display = 'flex';
    clearHistoryBtn.style.display = 'none';
    copyReceiptBtn.style.display = 'none';
    totalItemsCount.textContent = '0 поз.';
    grandTotalDisplay.textContent = '0 ₽';
    return;
  }

  emptyHistoryState.style.display = 'none';
  clearHistoryBtn.style.display = 'inline-flex';
  copyReceiptBtn.style.display = 'inline-flex';

  let grandTotal = 0;
  let totalQty = 0;

  purchaseHistory.forEach((item, index) => {
    grandTotal += item.total;
    totalQty += item.qty;

    const li = document.createElement('li');
    li.className = 'history-item';
    li.innerHTML = `
      <div class="item-info">
        <span class="item-title">${escapeHtml(item.productName)}</span>
        <span class="item-calc-details">${formatMoney(item.unitPrice)} × ${item.qty} = <strong>${formatMoney(item.total)}</strong></span>
      </div>
      <div class="item-actions-group">
        <span class="item-total-price">${formatMoney(item.total)}</span>
        <button class="btn-icon-delete" title="Удалить из чека" onclick="removeFromHistory(${index})">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;
    historyList.appendChild(li);
  });

  totalItemsCount.textContent = `${purchaseHistory.length} поз. (${totalQty} шт.)`;
  grandTotalDisplay.textContent = formatMoney(grandTotal);
}

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
  const historyEntry = {
    id: 'item_' + Date.now(),
    productId: selected.id,
    productName: selected.name,
    unitPrice: selected.price,
    qty: qty,
    total: total,
    timestamp: new Date().toISOString()
  };

  purchaseHistory.unshift(historyEntry);
  saveState();
  renderHistory();
  showToast(`Добавлено: ${selected.name} (${qty} шт.)`);

  // Reset quantity back to 1
  qtyInput.value = '1';
  updateSubtotal();
}

// Remove from history
window.removeFromHistory = function(index) {
  const removed = purchaseHistory[index];
  purchaseHistory.splice(index, 1);
  saveState();
  renderHistory();
  if (removed) {
    showToast(`Удалено: ${removed.productName}`);
  }
};

// Clear history
function handleClearHistory() {
  if (purchaseHistory.length === 0) return;
  if (confirm('Очистить всю историю текущей закупки?')) {
    purchaseHistory = [];
    saveState();
    renderHistory();
    showToast('История закупки очищена');
  }
}

// Copy Receipt
function handleCopyReceipt() {
  if (purchaseHistory.length === 0) return;

  let text = '🧾 ЧЕК ЗАКУПКИ\n';
  text += '-------------------------------\n';
  let total = 0;
  purchaseHistory.forEach((item, idx) => {
    text += `${idx + 1}. ${item.productName}\n   ${formatMoney(item.unitPrice)} × ${item.qty} = ${formatMoney(item.total)}\n`;
    total += item.total;
  });
  text += '-------------------------------\n';
  text += `ИТОГО К ОПЛАТЕ: ${formatMoney(total)}\n`;
  text += `Дата: ${new Date().toLocaleString('ru-RU')}`;

  navigator.clipboard.writeText(text).then(() => {
    showToast('Чек скопирован в буфер обмена!');
  }).catch(() => {
    showToast('Не удалось скопировать чек');
  });
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
  renderProducts();
  renderHistory();

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
  copyReceiptBtn.addEventListener('click', handleCopyReceipt);

  // Modal open/close
  openCatalogBtn.addEventListener('click', openModal);
  quickAddProductBtn.addEventListener('click', openModal);
  closeCatalogBtn.addEventListener('click', closeModal);

  catalogModal.addEventListener('click', (e) => {
    if (e.target === catalogModal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && catalogModal.classList.contains('active')) {
      closeModal();
    }
  });
});

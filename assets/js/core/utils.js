// ==================== UTILITY FUNCTIONS ====================
// Các hàm tiện ích dùng chung cho toàn bộ ứng dụng

// ==================== TOKEN MANAGEMENT ====================
const TokenHelper = {
  // Lấy access token
  getAccessToken: () => localStorage.getItem('accessToken'),
  
  // Lấy refresh token
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  
  // Lấy user ID
  getUserId: () => localStorage.getItem('userId'),
  
  // Lưu tokens
  saveTokens: (accessToken, refreshToken, userId) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('userId', userId);
  },
  
  // Xóa tokens
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
  },
  
  // Kiểm tra đã đăng nhập chưa
  isLoggedIn: () => {
    return !!localStorage.getItem('accessToken');
  },
  
  // Lấy thông tin user từ localStorage
  getUserInfo: () => {
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    const email = localStorage.getItem('email');
    const role = localStorage.getItem('role');
    
    if (userId) {
      return {
        id: parseInt(userId),
        username: username || '',
        email: email || '',
        role: role || ''
      };
    }
    return null;
  },
  
  // Lưu thông tin user
  saveUserInfo: (userId, username, email, role) => {
    localStorage.setItem('userId', userId);
    if (username) localStorage.setItem('username', username);
    if (email) localStorage.setItem('email', email);
    if (role) localStorage.setItem('role', role);
  }
};

// ==================== HTTP REQUEST HELPER ====================
/**
 * Hàm request HTTP chung
 * @param {string} url - URL đầy đủ
 * @param {object} options - Fetch options
 * @returns {Promise} - Response data
 */
async function httpRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  
  // Tự động thêm token nếu có
  const token = TokenHelper.getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP Error: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Request failed [${url}]:`, error);
    throw error;
  }
}

/**
 * Get user info from localStorage
 * @returns {object|null} - User info object hoặc null
 */
function getUserInfo() {
  return TokenHelper.getUserInfo();
}

/**
 * Hiển thị/ẩn loading state cho button
 * @param {HTMLButtonElement} btn - Button element
 * @param {boolean} isLoading - Đang loading hay không
 * @param {string} loadingText - Text khi loading
 * @returns {string} - HTML gốc của button
 */
function toggleButtonLoading(btn, isLoading, loadingText = 'Đang xử lý...') {
  if (!btn) return '';
  
  if (isLoading) {
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
    btn.disabled = true;
    btn.dataset.originalHtml = originalHTML;
    return originalHTML;
  } else {
    const originalHTML = btn.dataset.originalHtml || btn.innerHTML;
    btn.innerHTML = originalHTML;
    btn.disabled = false;
    delete btn.dataset.originalHtml;
    return originalHTML;
  }
}

/**
 * Hiển thị toast notification
 * @param {string} message - Nội dung thông báo
 * @param {string} type - Loại: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Thời gian hiển thị (ms)
 */
function showToast(message, type = 'info', duration = 3000) {
  // Tạo toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    <span>${message}</span>
  `;
  
  // Style inline (nếu chưa có CSS)
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#2ed573' : type === 'error' ? '#ff4757' : type === 'warning' ? '#ffa502' : '#3498db'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    animation: slideIn 0.3s ease;
    display: flex;
    align-items: center;
    gap: 10px;
  `;
  
  document.body.appendChild(toast);
  
  // Tự động xóa sau duration
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Format giá tiền VND
 * @param {number} price - Giá tiền
 * @returns {string} - Giá đã format
 */
function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
}

/**
 * Format ngày tháng
 * @param {string|Date} date - Ngày cần format
 * @param {string} format - Format: 'short', 'long', 'time'
 * @returns {string} - Ngày đã format
 */
function formatDate(date, format = 'short') {
  const d = new Date(date);
  
  if (format === 'short') {
    return d.toLocaleDateString('vi-VN');
  } else if (format === 'long') {
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } else if (format === 'time') {
    return d.toLocaleString('vi-VN');
  }
  
  return d.toLocaleDateString('vi-VN');
}

/**
 * Validate email
 * @param {string} email - Email cần validate
 * @returns {boolean}
 */
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate số điện thoại VN
 * @param {string} phone - Số điện thoại
 * @returns {boolean}
 */
function isValidPhone(phone) {
  const regex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
  return regex.test(phone);
}

/**
 * Debounce function
 * @param {Function} func - Hàm cần debounce
 * @param {number} delay - Delay time (ms)
 * @returns {Function}
 */
function debounce(func, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Get query params from URL
 * @param {string} param - Tên param
 * @returns {string|null}
 */
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

/**
 * Redirect với query params
 * @param {string} url - URL
 * @param {object} params - Query params
 */
function redirectWithParams(url, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  window.location.href = queryString ? `${url}?${queryString}` : url;
}

/**
 * Show/Hide element
 * @param {HTMLElement} element - Element
 * @param {boolean} show - Show hay hide
 */
function toggleElement(element, show) {
  if (!element) return;
  element.style.display = show ? 'block' : 'none';
}

/**
 * Add/Remove class
 * @param {HTMLElement} element - Element
 * @param {string} className - Class name
 * @param {boolean} add - Add hay remove
 */
function toggleClass(element, className, add) {
  if (!element) return;
  if (add) {
    element.classList.add(className);
  } else {
    element.classList.remove(className);
  }
}

// ==================== VALIDATION HELPERS ====================

/**
 * Hiển thị error cho input field
 * @param {HTMLInputElement} input - Input element
 * @param {string} errorMessage - Error message
 */
function showInputError(input, errorMessage) {
  if (!input) return;
  
  input.classList.add('input-error');
  
  // Tìm hoặc tạo error message element
  let errorEl = input.parentElement.querySelector('.error-message');
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    input.parentElement.appendChild(errorEl);
  }
  
  errorEl.textContent = errorMessage;
  errorEl.style.display = 'block';
}

/**
 * Xóa error cho input field
 * @param {HTMLInputElement} input - Input element
 */
function clearInputError(input) {
  if (!input) return;
  
  input.classList.remove('input-error');
  
  const errorEl = input.parentElement.querySelector('.error-message');
  if (errorEl) {
    errorEl.style.display = 'none';
  }
}

/**
 * Validate form
 * @param {HTMLFormElement} form - Form element
 * @returns {boolean} - Valid hay không
 */
function validateForm(form) {
  if (!form) return false;
  
  let isValid = true;
  const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
  
  inputs.forEach(input => {
    if (!input.value.trim()) {
      showInputError(input, 'Trường này không được để trống');
      isValid = false;
    } else {
      clearInputError(input);
    }
  });
  
  return isValid;
}

// ==================== LOCAL STORAGE HELPERS ====================

/**
 * Lưu object vào localStorage
 * @param {string} key - Key
 * @param {any} value - Value
 */
function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

/**
 * Lấy object từ localStorage
 * @param {string} key - Key
 * @returns {any} - Value
 */
function getStorage(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Error getting from localStorage:', error);
    return null;
  }
}

/**
 * Xóa key từ localStorage
 * @param {string} key - Key
 */
function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
}

// ==================== EXPORT ====================
// Export để sử dụng trong modules khác (nếu dùng ES6)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TokenHelper,
    httpRequest,
    getUserInfo,
    toggleButtonLoading,
    showToast,
    formatPrice,
    formatDate,
    isValidEmail,
    isValidPhone,
    debounce,
    getQueryParam,
    redirectWithParams,
    toggleElement,
    toggleClass,
    showInputError,
    clearInputError,
    validateForm,
    setStorage,
    getStorage,
    removeStorage
  };
}
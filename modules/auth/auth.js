/* ==================== AUTH MODULE JS ==================== */
/* Xử lý logic cho: Login, Register, Logout */

// ==================== API CALLS ====================

/**
 * API: Đăng nhập
 * @param {string} email - Email
 * @param {string} password - Mật khẩu
 * @returns {Promise} - Response data
 */
async function loginAPI(email, password) {
  const url = `${window.BASE_URL}/api/auth/login`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Đăng nhập thất bại');
  }
  
  return data;
}

/**
 * API: Đăng ký
 * @param {string} fullName - Họ tên
 * @param {string} email - Email
 * @param {string} password - Mật khẩu
 * @param {string} retypePassword - Nhập lại mật khẩu
 * @returns {Promise} - Response data
 */
async function registerAPI(fullName, email, password, retypePassword) {
  const url = `${window.BASE_URL}/api/auth/register`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fullName, email, password, retypePassword })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Đăng ký thất bại');
  }
  
  return data;
}

/**
 * API: Đăng xuất
 * @param {number} userId - User ID
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise} - Response data
 */
async function logoutAPI(userId, accessToken, refreshToken) {
  const url = `${window.BASE_URL}/api/auth/logout`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ userId, accessToken, refreshToken })
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || data.error || 'Đăng xuất thất bại');
  }
  
  return response.json();
}

/**
 * API: Đăng nhập bằng Google
 * @param {string} token - Google Access Token
 * @returns {Promise} - Response data
 */
async function loginGoogleAPI(token) {
  const url = `${window.BASE_URL}/api/auth/social/google`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Đăng nhập Google thất bại');
  }
  
  return data;
}

/**
 * API: Đăng nhập bằng Facebook
 * @param {string} token - Facebook Access Token
 * @returns {Promise} - Response data
 */
async function loginFacebookAPI(token) {
  const url = `${window.BASE_URL}/api/auth/social/facebook`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Đăng nhập Facebook thất bại');
  }
  
  return data;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Toggle hiển thị/ẩn mật khẩu
 * @param {HTMLElement} toggleBtn - Nút toggle
 * @param {HTMLInputElement} inputField - Input field mật khẩu
 */
function togglePasswordVisibility(toggleBtn, inputField) {
  if (!toggleBtn || !inputField) return;
  
  toggleBtn.addEventListener('click', function() {
    const icon = this.querySelector('i');
    
    if (inputField.type === 'password') {
      inputField.type = 'text';
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    } else {
      inputField.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  });
}

/**
 * Kiểm tra độ mạnh mật khẩu
 * @param {string} password - Mật khẩu cần kiểm tra
 * @returns {Object} - { strength: number, text: string, color: string }
 */
function checkPasswordStrength(password) {
  let strength = 0;
  let text = 'Rất yếu';
  let color = '#ff4757';
  
  if (password.length >= 6) strength += 25;
  if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 25;
  if (password.match(/\d/)) strength += 25;
  if (password.match(/[^a-zA-Z\d]/)) strength += 25;
  
  if (strength >= 75) {
    text = 'Mạnh';
    color = '#2ed573';
  } else if (strength >= 50) {
    text = 'Trung bình';
    color = '#ffa502';
  } else if (strength >= 25) {
    text = 'Yếu';
    color = '#ff7f50';
  }
  
  return { strength, text, color };
}

/**
 * Hiển thị password strength bar
 * @param {HTMLInputElement} passwordInput - Input mật khẩu
 * @param {HTMLElement} strengthBar - Thanh hiển thị độ mạnh
 * @param {HTMLElement} strengthText - Text hiển thị độ mạnh
 */
function initPasswordStrength(passwordInput, strengthBar, strengthText) {
  if (!passwordInput || !strengthBar || !strengthText) return;
  
  passwordInput.addEventListener('input', function() {
    const password = this.value;
    const { strength, text, color } = checkPasswordStrength(password);
    
    strengthBar.style.width = `${strength}%`;
    strengthBar.style.background = color;
    strengthText.textContent = `Độ mạnh mật khẩu: ${text}`;
    strengthText.style.color = color;
  });
}

/**
 * Validate email
 * @param {string} email - Email cần validate
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Hiển thị error/success cho input field
 * @param {HTMLInputElement} input - Input field
 * @param {boolean} isValid - Valid hay không
 * @param {HTMLElement} errorMsg - Error message element
 * @param {HTMLElement} successMsg - Success message element (optional)
 */
function showInputValidation(input, isValid, errorMsg, successMsg = null) {
  if (!input) return;
  
  if (isValid) {
    input.classList.remove('input-error');
    if (errorMsg) errorMsg.style.display = 'none';
    if (successMsg) successMsg.style.display = 'block';
  } else {
    input.classList.add('input-error');
    if (errorMsg) errorMsg.style.display = 'block';
    if (successMsg) successMsg.style.display = 'none';
  }
}

/**
 * Hiển thị toast notification
 * @param {String} message - Message to show
 * @param {String} type - Type of toast (success, error, warning)
 */
function showToast(message, type = 'success') {
  // Remove existing toasts
  document.querySelectorAll('.toast').forEach(toast => toast.remove());
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #1a1a1a;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    border-left: 4px solid ${type === 'success' ? '#2ed573' : type === 'error' ? '#ff4757' : '#ffa502'};
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 10000;
    animation: slideInRight 0.3s ease;
    max-width: 350px;
  `;
  
  const iconClass = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
  toast.innerHTML = `
    <i class="fas ${iconClass}" style="color: ${type === 'success' ? '#2ed573' : type === 'error' ? '#ff4757' : '#ffa502'}; font-size: 1.2rem;"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ==================== EVENT HANDLERS ====================

/**
 * Kiểm tra xem user có phải admin không
 * @param {string} token - JWT access token
 * @returns {boolean}
 */
function checkAdminRole(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('🔍 JWT Payload:', payload);
    
    // Kiểm tra field 'roles' trong payload
    if (payload.roles) {
      console.log('👤 User roles:', payload.roles);
      
      // Roles có thể là string hoặc array
      const roles = typeof payload.roles === 'string' ? [payload.roles] : payload.roles;
      
      const adminRoles = ['ROLE_ADMIN', 'ROLE_SYS_ADMIN', 'ROLE_SYSTEM_ADMIN', 'ADMIN'];
      const isAdmin = roles.some(role => adminRoles.includes(role));
      
      console.log('✅ Is admin?', isAdmin);
      return isAdmin;
    }
    
    // Fallback: kiểm tra field 'scope' (nếu có)
    if (payload.scope) {
      const roles = payload.scope.split(' ');
      console.log('👤 User roles (from scope):', roles);
      
      const adminRoles = ['ROLE_ADMIN', 'ROLE_SYS_ADMIN', 'ROLE_SYSTEM_ADMIN', 'ADMIN'];
      const isAdmin = roles.some(role => adminRoles.includes(role));
      
      console.log('✅ Is admin?', isAdmin);
      return isAdmin;
    }
    
    console.log('❌ No roles found in token');
    return false;
  } catch (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
}

/**
 * Xử lý đăng nhập
 * @param {Event} e - Submit event
 */
async function handleLogin(e) {
  e.preventDefault();
  
  const form = e.target;
  const email = form.email.value.trim();
  const password = form.password.value.trim();
  const submitBtn = form.querySelector('.login-btn, button[type="submit"]');
  
  if (!submitBtn) return;
  
  const originalHTML = toggleButtonLoading(submitBtn, true, 'Đang đăng nhập...');

  try {
    const res = await loginAPI(email, password);
    console.log('✅ Login response:', res);
    
    // Backend trả về ApiResponse với payload chứa token info
    const tokenData = res.payload || res;
    console.log('🔑 Token data:', tokenData);
    
    if (!tokenData.accessToken) {
      throw new Error('Không nhận được token từ server');
    }
    
    // Lưu thông tin đăng nhập
    TokenHelper.saveTokens(tokenData.accessToken, tokenData.refreshToken, tokenData.userId);
    
    // Lưu email để hiển thị
    localStorage.setItem('user_email', email);
    
    // Kiểm tra role để redirect phù hợp
    const isAdmin = checkAdminRole(tokenData.accessToken);
    
    console.log('🎯 IS ADMIN?', isAdmin);
    console.log('🔗 Will redirect to:', isAdmin ? '../admin/dashboard.html' : '../product/shop.html');
    
    if (isAdmin) {
      showToast('Đăng nhập thành công! Đang chuyển đến trang quản trị...', 'success');
      
      // Redirect đến trang admin sau 1 giây
      setTimeout(() => {
        console.log('🚀 Redirecting to admin dashboard...');
        window.location.href = '../admin/dashboard.html';
      }, 1000);
    } else {
      showToast('Đăng nhập thành công! Đang chuyển đến cửa hàng...', 'success');
      
      // Redirect về shop sau 1 giây
      setTimeout(() => {
        console.log('🚀 Redirecting to shop page...');
        window.location.href = '../product/shop.html';
      }, 1000);
    }
    
  } catch (err) {
    console.error('Login error:', err);
    showToast('Đăng nhập thất bại: ' + err.message, 'error');
  } finally {
    toggleButtonLoading(submitBtn, false);
  }
}

/**
 * Xử lý đăng ký
 * @param {Event} e - Submit event
 */
async function handleRegister(e) {
  e.preventDefault();
  
  const form = e.target;
  const fullName = form.fullName.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value.trim();
  const confirmPassword = form.confirmPassword?.value.trim() || form.retypePassword?.value.trim();
  const agreeTerms = form.querySelector('#agreeTerms, input[type="checkbox"]')?.checked;
  const submitBtn = form.querySelector('.login-btn, button[type="submit"]');
  
  if (!submitBtn) return;

  // Validation
  if (agreeTerms === false) {
    alert('Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật!');
    return;
  }

  if (password !== confirmPassword) {
    alert('Mật khẩu nhập lại không khớp!');
    return;
  }

  if (password.length < 6) {
    alert('Mật khẩu phải có ít nhất 6 ký tự!');
    return;
  }

  if (!isValidEmail(email)) {
    alert('Email không hợp lệ!');
    return;
  }

  toggleButtonLoading(submitBtn, true, 'Đang đăng ký...');

  try {
    const res = await registerAPI(fullName, email, password, confirmPassword);

    if (res.success) {
      alert('Đăng ký thành công! Bạn có thể đăng nhập ngay.');
      window.location.href = CONFIG.ROUTES.LOGIN;
    } else {
      const errorMsg = res.errors ? res.errors.join('\n') : res.error || res.message;
      alert('Đăng ký thất bại:\n' + errorMsg);
    }
  } catch (err) {
    console.error('Register error:', err);
    alert('Đăng ký thất bại: ' + err.message);
  } finally {
    toggleButtonLoading(submitBtn, false);
  }
}

/**
 * Xử lý thành công sau khi login social
 * @param {Object} res - Response từ API
 */
async function handleSocialLoginSuccess(res) {
  console.log('✅ Social Login response:', res);
  
  // Backend trả về ApiResponse với payload chứa token info
  const tokenData = res.payload || res;
  console.log('🔑 Token data:', tokenData);
  
  if (!tokenData.accessToken) {
    throw new Error('Không nhận được token từ server');
  }
  
  // Lưu thông tin đăng nhập
  TokenHelper.saveTokens(tokenData.accessToken, tokenData.refreshToken, tokenData.userId);
  
  // Kiểm tra role để redirect phù hợp
  const isAdmin = checkAdminRole(tokenData.accessToken);
  
  if (isAdmin) {
    showToast('Đăng nhập thành công! Đang chuyển đến trang quản trị...', 'success');
    setTimeout(() => {
      window.location.href = '../admin/dashboard.html';
    }, 1000);
  } else {
    showToast('Đăng nhập thành công! Đang chuyển đến cửa hàng...', 'success');
    setTimeout(() => {
      window.location.href = '../product/shop.html';
    }, 1000);
  }
}

/**
 * Khởi tạo Social Login (Google, Facebook)
 */
function initSocialLogin() {
  // 1. Cấu hình hàm init cho Facebook SDK
  window.fbAsyncInit = function() {
    FB.init({
      appId      : '1382594643258140',
      cookie     : true,
      xfbml      : true,
      version    : 'v18.0'
    });
    console.log('✅ Facebook SDK đã được khởi tạo');
  };

  // 2. Xử lý trường hợp SDK đã tải xong trước khi gán window.fbAsyncInit
  if (typeof FB !== 'undefined') {
    window.fbAsyncInit();
  }

  // Google Login
  const googleBtn = document.getElementById('google-login-btn');
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      if (typeof google === 'undefined') {
        showToast('Google Sign-In chưa sẵn sàng. Vui lòng thử lại sau.', 'error');
        return;
      }
      
      const client = google.accounts.oauth2.initTokenClient({
        client_id: 'YOUR_GOOGLE_CLIENT_ID', // Cần thay thế bằng Client ID thật
        scope: 'email profile openid',
        callback: async (response) => {
          if (response.access_token) {
            try {
              showToast('Đang đăng nhập bằng Google...', 'info');
              const res = await loginGoogleAPI(response.access_token);
              handleSocialLoginSuccess(res);
            } catch (err) {
              console.error('Google login error:', err);
              showToast('Đăng nhập Google thất bại: ' + err.message, 'error');
            }
          }
        },
      });
      client.requestAccessToken();
    });
  }

  // Facebook Login
  const facebookBtn = document.getElementById('facebook-login-btn');
  if (facebookBtn) {
    facebookBtn.addEventListener('click', () => {
      // Kiểm tra HTTPS
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        alert('Lỗi: Facebook Login yêu cầu chạy trên HTTPS hoặc http://localhost.\nHãy đổi URL trên trình duyệt từ 127.0.0.1 thành localhost.');
        return;
      }

      if (typeof FB === 'undefined') {
        showToast('Facebook Login chưa sẵn sàng. Vui lòng thử lại sau.', 'error');
        return;
      }
      
      // Hàm xử lý logic async tách biệt
      const handleFacebookResponse = async (response) => {
        if (response.authResponse) {
          try {
            showToast('Đang đăng nhập bằng Facebook...', 'info');
            const res = await loginFacebookAPI(response.authResponse.accessToken);
            handleSocialLoginSuccess(res);
          } catch (err) {
            console.error('Facebook login error:', err);
            showToast('Đăng nhập Facebook thất bại: ' + err.message, 'error');
          }
        } else {
          console.log('User cancelled login or did not fully authorize.');
        }
      };

      // Gọi FB.login với callback thường (không async)
      FB.login((response) => {
        handleFacebookResponse(response);
      }, {scope: 'public_profile,email'});
    });
  }
}

/**
 * Xử lý đăng xuất
 */
async function handleLogout() {
  const accessToken = TokenHelper.getAccessToken();
  const refreshToken = TokenHelper.getRefreshToken();
  const userId = TokenHelper.getUserId();

  if (!TokenHelper.isLoggedIn()) {
    alert("Bạn chưa đăng nhập!");
    return;
  }

  const confirmLogout = confirm("Bạn có chắc muốn đăng xuất?");
  if (!confirmLogout) return;

  try {
    await logoutAPI(Number(userId), accessToken, refreshToken);
    
    // Xóa token
    TokenHelper.clearTokens();
    
    alert("Đăng xuất thành công!");
    window.location.href = CONFIG.ROUTES.LOGIN;
    
  } catch (err) {
    console.error("Logout error:", err);
    
    // Vẫn xóa token local ngay cả khi API lỗi
    TokenHelper.clearTokens();
    alert("Đã đăng xuất!");
    window.location.href = CONFIG.ROUTES.LOGIN;
  }
}

// ==================== AUTO-INIT ====================

/**
 * Tự động khởi tạo khi DOM ready
 */
document.addEventListener('DOMContentLoaded', function() {
  // Toggle password visibility
  const togglePasswordBtns = document.querySelectorAll('.toggle-password');
  togglePasswordBtns.forEach(btn => {
    const inputGroup = btn.closest('.input-group');
    if (inputGroup) {
      const passwordInput = inputGroup.querySelector('input[type="password"]');
      if (passwordInput) {
        togglePasswordVisibility(btn, passwordInput);
      }
    }
  });
  
  // Password strength indicator
  const passwordInput = document.querySelector('input[name="password"]');
  const strengthBar = document.getElementById('password-strength-bar');
  const strengthText = document.getElementById('password-strength-text');
  if (passwordInput && strengthBar && strengthText) {
    initPasswordStrength(passwordInput, strengthBar, strengthText);
  }
  
  // Email validation
  const emailInput = document.querySelector('input[name="email"]');
  const emailError = document.getElementById('email-error');
  const emailSuccess = document.getElementById('email-success');
  if (emailInput) {
    emailInput.addEventListener('input', function() {
      const isValid = isValidEmail(this.value);
      if (this.value) {
        showInputValidation(this, isValid, emailError, emailSuccess);
      }
    });
  }
  
  // Confirm password validation
  const confirmPasswordInput = document.querySelector('input[name="confirmPassword"], input[name="retypePassword"]');
  const confirmError = document.getElementById('confirm-password-error');
  const confirmSuccess = document.getElementById('confirm-password-success');
  if (confirmPasswordInput && passwordInput) {
    confirmPasswordInput.addEventListener('input', function() {
      const isMatch = this.value === passwordInput.value;
      if (this.value) {
        showInputValidation(this, isMatch, confirmError, confirmSuccess);
      }
    });
  }
  
  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Register form
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
  
  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Init Social Login
  initSocialLogin();
  
  // Redirect nếu đã login và đang ở trang login/register
  if (TokenHelper.isLoggedIn()) {
    const currentPath = window.location.pathname;
    if (currentPath.includes('login.html') || currentPath.includes('register.html')) {
      // Uncomment nếu muốn auto redirect
      // window.location.href = CONFIG.ROUTES.HOME;
    }
  }
});

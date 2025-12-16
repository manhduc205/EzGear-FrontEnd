/* ==================== PROFILE MODULE JS ==================== */

document.addEventListener('DOMContentLoaded', () => {
    initProfilePage();
    
    const saveBtn = document.getElementById('saveProfileBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveProfile);
    }
});

async function initProfilePage() {
    showLoading(true);
    try {
        if (!TokenHelper.isLoggedIn()) {
            console.log('User not logged in, redirecting...');
            window.location.href = '../auth/login.html';
            return;
        }

        // Fetch Profile Data
        const url = `${window.BASE_URL}/api/users/profile`;
        console.log('Fetching profile from:', url);
        
        const response = await httpRequest(url, { method: 'GET' });
        console.log('Profile response:', response);
        
        if (response.success) {
            const user = response.payload;
            renderProfile(user);
        } else {
            console.error('Profile load failed:', response.message);
            alert(response.message || 'Không thể tải thông tin hồ sơ');
        }

    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Có lỗi xảy ra khi tải hồ sơ: ' + (error.message || 'Lỗi không xác định'));
    } finally {
        showLoading(false);
    }
}

function renderProfile(user) {
    // Sidebar Info
    const sidebarName = document.getElementById('sidebarName');
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    
    if (sidebarName) sidebarName.textContent = user.full_name || user.username || 'User';
    // if (sidebarAvatar && user.avatar) sidebarAvatar.src = user.avatar;

    // Form Fields
    const emailDisplay = document.getElementById('emailDisplay');
    const fullNameInput = document.getElementById('fullName');
    const phoneDisplay = document.getElementById('phoneDisplay');
    const mainAvatar = document.getElementById('mainAvatar');

    if (emailDisplay) emailDisplay.textContent = user.email || '...';
    if (fullNameInput) fullNameInput.value = user.full_name || '';
    if (phoneDisplay) phoneDisplay.textContent = user.phone_number || '...';
    
    // Avatar (if API returns it, otherwise keep placeholder)
    // if (mainAvatar && user.avatar) mainAvatar.src = user.avatar;
}

async function handleSaveProfile() {
    const fullName = document.getElementById('fullName').value;
    // Get other values...

    showLoading(true);
    try {
        // Mock API call for update (since endpoint not provided)
        // const url = `${window.BASE_URL}/users/profile`;
        // const response = await httpRequest(url, { 
        //     method: 'PUT',
        //     body: JSON.stringify({ fullName })
        // });
        
        // Simulate success
        await new Promise(resolve => setTimeout(resolve, 1000));
        alert('Cập nhật hồ sơ thành công (Mô phỏng)');
        
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Có lỗi xảy ra khi cập nhật');
    } finally {
        showLoading(false);
    }
}

// ==================== UTILS ====================
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) overlay.classList.add('active');
        else overlay.classList.remove('active');
    }
}

function maskEmail(email) {
    if (!email) return '...';
    const [name, domain] = email.split('@');
    if (name.length <= 2) return email;
    return `${name.substring(0, 2)}***@${domain}`;
}

function maskPhone(phone) {
    if (!phone) return '...';
    if (phone.length < 4) return phone;
    return `********${phone.substring(phone.length - 2)}`;
}

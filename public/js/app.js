// Main Application Logic

// State
let currentUser = null;

// DOM Elements
const loader = document.getElementById('loader');
const pages = {
    login: document.getElementById('login-page'),
    register: document.getElementById('register-page'),
    dashboard: document.getElementById('dashboard-page'),
    profile: document.getElementById('profile-page'),
    settings: document.getElementById('settings-page'),
    users: document.getElementById('users-page')
};

// Validation Functions
function validateRegister(data) {
    const errors = [];

    if (!data.firstname || data.firstname.length < 2) {
        errors.push('First name must be at least 2 characters');
    }
    if (!data.lastname || data.lastname.length < 2) {
        errors.push('Last name must be at least 2 characters');
    }
    if (!data.username || data.username.length < 3) {
        errors.push('Username must be at least 3 characters');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
        errors.push('Username can only contain letters, numbers and underscores');
    }
    if (!data.phone || !/(^(0?9)|(\+?989))\d{2}\W?\d{3}\W?\d{4}/g.test(data.phone)) {
        errors.push('Invalid phone number format');
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Invalid email format');
    }
    if (!data.password || data.password.length < 8) {
        errors.push('Password must be at least 8 characters');
    }

    return errors;
}

function validateLogin(data) {
    const errors = [];

    if (!data.identifier) {
        errors.push('Username or phone is required');
    }
    if (!data.password) {
        errors.push('Password is required');
    }

    return errors;
}

function validateChangePassword(data) {
    const errors = [];

    if (!data.currentPassword) {
        errors.push('Current password is required');
    }
    if (!data.newPassword || data.newPassword.length < 8) {
        errors.push('New password must be at least 8 characters');
    }
    if (data.currentPassword && data.newPassword && data.currentPassword === data.newPassword) {
        errors.push('New password must be different from current password');
    }

    return errors;
}

function validateVerificationCode(code) {
    const errors = [];

    if (!code || !/^\d{6}$/.test(code)) {
        errors.push('Code must be 6 digits');
    }

    return errors;
}

function showFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;

    // Remove existing error
    const existingError = input.parentElement.querySelector('.field-error');
    if (existingError) existingError.remove();

    // Add error class
    input.classList.add('input-error');

    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.color = 'var(--danger)';
    errorDiv.style.fontSize = '0.8rem';
    errorDiv.style.marginTop = '0.25rem';
    input.parentElement.appendChild(errorDiv);
}

function clearFieldErrors() {
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    document.querySelectorAll('.field-error').forEach(el => el.remove());
}

// Toast Notifications
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle'
    };

    toast.innerHTML = `
        <i class="fas ${icons[type]} toast-icon"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'toastSlide 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Page Navigation
function navigate(page) {
    Object.values(pages).forEach(p => p.classList.add('hidden'));
    pages[page].classList.remove('hidden');

    // Load page-specific data
    if (page === 'dashboard') loadDashboard();
    if (page === 'profile') loadProfile();
    if (page === 'settings') loadSettings();
    if (page === 'users') loadUsers();

    window.scrollTo(0, 0);
}

// Check Authentication
async function checkAuth() {
    try {
        loader.classList.remove('hidden');
        const response = await api.checkAuth();
        currentUser = await api.getMe();
        loader.classList.add('hidden');
        return true;
    } catch (error) {
        loader.classList.add('hidden');
        return false;
    }
}

// Update Navbar
function updateNavbar() {
    if (!currentUser) return;

    const navAvatar = document.getElementById('nav-avatar');
    const navUsername = document.getElementById('nav-username');
    const navRole = document.getElementById('nav-role');

    navUsername.textContent = currentUser.data?.username || 'User';

    if (currentUser.data?.role === 'admin') {
        navRole.textContent = 'Admin';
        navRole.classList.add('admin');
        document.querySelector('.admin-only')?.classList.remove('hidden');
    } else {
        navRole.textContent = 'User';
        navRole.classList.remove('admin');
        document.querySelector('.admin-only')?.classList.add('hidden');
    }

    if (currentUser.data?.profilePic) {
        const picUrl = currentUser.data.profilePic.startsWith('/')
            ? window.location.origin + currentUser.data.profilePic
            : currentUser.data.profilePic;
        navAvatar.innerHTML = `<img src="${picUrl}" alt="Avatar" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-user\\'></i>'">`;
    } else {
        navAvatar.innerHTML = '<i class="fas fa-user"></i>';
    }
}

// Dashboard
async function loadDashboard() {
    document.getElementById('welcome-name').textContent =
        currentUser.data?.firstname || 'User';
    updateNavbar();
}

// Profile Page
async function loadProfile() {
    if (!currentUser?.data) return;

    const user = currentUser.data;
    const fullname = `${user.firstname || ''} ${user.lastname || ''}`.trim();

    document.getElementById('profile-fullname').textContent = fullname || 'User';
    document.getElementById('profile-username').textContent = `@${user.username || 'unknown'}`;
    document.getElementById('profile-role').textContent = user.role || 'user';

    // Avatar
    const avatar = document.getElementById('profile-avatar');
    if (user.profilePic) {
        avatar.innerHTML = `<img src="${user.profilePic}" alt="Profile">`;
    } else {
        avatar.innerHTML = '<i class="fas fa-user"></i>';
    }

    // Form inputs
    document.getElementById('input-firstname').value = user.firstname || '';
    document.getElementById('input-lastname').value = user.lastname || '';

    // Show current profile picture in preview
    const profilePreview = document.getElementById('profile-preview');
    if (user.profilePic) {
        profilePreview.innerHTML = `<img src="${user.profilePic}" alt="Current Profile">`;
        profilePreview.classList.add('has-image');
    } else {
        profilePreview.innerHTML = '';
        profilePreview.classList.remove('has-image');
    }

    // Static info
    document.getElementById('info-userid').textContent = user._id || '-';
    document.getElementById('info-username').textContent = `@${user.username || '-'}`;
    document.getElementById('info-phone').textContent = user.phone || '-';
    document.getElementById('info-email').textContent = user.email || '- (optional)';
    document.getElementById('info-role').textContent = user.role || '-';
    document.getElementById('info-createdat').textContent = user.createdAt ?
        new Date(user.createdAt).toLocaleDateString() : '-';
}

// Settings Page
async function loadSettings() {
    if (!currentUser?.data) return;

    document.getElementById('current-phone').textContent = currentUser.data.phone || 'Not set';
    document.getElementById('current-email').textContent = currentUser.data.email || 'Not set';

    // Show/hide email sections based on whether user has email
    const hasEmail = !!currentUser.data.email;
    document.getElementById('email-add-section').classList.toggle('hidden', hasEmail);
    document.getElementById('email-section').classList.toggle('hidden', !hasEmail);
    document.getElementById('email-code-section').classList.add('hidden');

    // Reset email inputs
    document.getElementById('new-email').value = '';
    document.getElementById('change-email').value = '';
    document.getElementById('email-code').value = '';
    document.getElementById('email-verification-id').value = '';
}

// Users Management (Admin)
async function loadUsers() {
    try {
        const response = await api.getAllUsers();
        const users = response.data || [];

        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar">
                            ${user.profilePic ?
                `<img src="${user.profilePic}" alt="${user.firstname}">` :
                (user.firstname?.[0] || 'U').toUpperCase()}
                        </div>
                        <div>
                            <div class="user-name">${user.firstname} ${user.lastname}</div>
                            <div class="user-id">${user._id}</div>
                        </div>
                    </div>
                </td>
                <td>@${user.username}</td>
                <td>${user.phone}</td>
                <td>${user.email || '-'}</td>
                <td><span class="badge ${user.role === 'admin' ? 'admin' : ''}">${user.role}</span></td>
                <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                <td>
                    <div class="actions">
                        <button class="btn-action" onclick="deleteUser('${user._id}')" title="Delete User">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast('Failed to load users', 'error');
    }
}

// Delete User (Admin)
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        await api.deleteUser(userId);
        showToast('User deleted successfully', 'success');
        loadUsers();
    } catch (error) {
        showToast(error.message || 'Failed to delete user', 'error');
    }
}

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function openDeleteModal() {
    const form = document.getElementById('delete-account-form');
    form.reset();
    // Reset button state
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-trash"></i> Delete Account';
    openModal('delete-modal');
}

// Refresh User Data
async function refreshUser() {
    try {
        currentUser = await api.getMe();
    } catch (error) {
        console.error('Failed to refresh user data');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    const isAuth = await checkAuth();

    if (isAuth && currentUser) {
        navigate('dashboard');
    } else {
        navigate('login');
    }

    // Handle hash navigation
    window.addEventListener('hashchange', async () => {
        const hash = window.location.hash.slice(1);
        if (hash === 'login') {
            navigate('login');
        } else if (hash === 'register') {
            navigate('register');
        }
    });

    // Direct click handlers for auth page links
    document.querySelectorAll('a[href="#register"], a[href="#login"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('href').slice(1);
            navigate(page);
        });
    });
});

// Toggle Password Visibility
document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', function () {
        const input = this.parentElement.querySelector('input');
        const icon = this.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    });
});

// File Preview & Crop functionality
let currentCropInput = null;
let currentCropPreview = null;
let cropData = {
    scale: 1,
    positionX: 0,
    positionY: 0,
    image: null
};
let isDragging = false;
let dragStart = { x: 0, y: 0 };

function openCropModal(inputId, previewId) {
    const input = document.getElementById(inputId);
    const file = input.files[0];

    if (!file) return;

    currentCropInput = input;
    currentCropPreview = previewId;

    const reader = new FileReader();
    reader.onload = function (e) {
        cropData = {
            scale: 1,
            positionX: 0,
            positionY: 0,
            image: e.target.result
        };

        document.getElementById('crop-image').src = e.target.result;
        document.getElementById('zoom-range').value = 1;
        document.getElementById('crop-modal').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function closeCropModal() {
    document.getElementById('crop-modal').classList.add('hidden');
    cropData = { scale: 1, positionX: 0, positionY: 0, image: null };
}

function applyCrop() {
    if (!currentCropInput || !cropData.image) return;

    // Create canvas for cropped image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 300; // Output size

    canvas.width = size;
    canvas.height = size;

    // Create image element
    const img = new Image();
    img.onload = function () {
        // Calculate source rectangle based on crop data
        const scale = cropData.scale;
        const sourceSize = Math.min(img.width, img.height);
        const sourceX = (img.width - sourceSize) / 2 - cropData.positionX / scale;
        const sourceY = (img.height - sourceSize) / 2 - cropData.positionY / scale;

        // Draw cropped circle
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();

        ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);

        // Get data URL
        const croppedImage = canvas.toDataURL('image/jpeg', 0.9);

        // Update preview
        const preview = document.getElementById(currentCropPreview);
        if (preview) {
            preview.innerHTML = `<img src="${croppedImage}" alt="Preview">`;
            preview.classList.add('has-image');
        }

        // Convert to blob and update file input
        canvas.toBlob(function (blob) {
            const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);

            // Store cropped image for form submission
            if (currentCropPreview === 'register-preview') {
                window.croppedRegisterPic = croppedImage;
            } else if (currentCropPreview === 'profile-preview') {
                window.croppedProfilePic = croppedImage;
            }

            closeCropModal();
        }, 'image/jpeg', 0.9);
    };
    img.src = cropData.image;
}

// Crop modal event listeners
document.addEventListener('DOMContentLoaded', function () {
    const cropImage = document.getElementById('crop-image');
    const cropContainer = document.getElementById('crop-container');
    const zoomRange = document.getElementById('zoom-range');

    // Zoom controls
    document.getElementById('zoom-in').addEventListener('click', function () {
        cropData.scale = Math.min(3, cropData.scale + 0.2);
        zoomRange.value = cropData.scale;
        updateCropImage();
    });

    document.getElementById('zoom-out').addEventListener('click', function () {
        cropData.scale = Math.max(0.5, cropData.scale - 0.2);
        zoomRange.value = cropData.scale;
        updateCropImage();
    });

    zoomRange.addEventListener('input', function () {
        cropData.scale = parseFloat(this.value);
        updateCropImage();
    });

    // Drag to pan
    cropContainer.addEventListener('mousedown', function (e) {
        isDragging = true;
        dragStart = { x: e.clientX - cropData.positionX, y: e.clientY - cropData.positionY };
    });

    document.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        cropData.positionX = e.clientX - dragStart.x;
        cropData.positionY = e.clientY - dragStart.y;
        updateCropImage();
    });

    document.addEventListener('mouseup', function () {
        isDragging = false;
    });

    // Touch support
    cropContainer.addEventListener('touchstart', function (e) {
        isDragging = true;
        const touch = e.touches[0];
        dragStart = { x: touch.clientX - cropData.positionX, y: touch.clientY - cropData.positionY };
    });

    document.addEventListener('touchmove', function (e) {
        if (!isDragging) return;
        const touch = e.touches[0];
        cropData.positionX = touch.clientX - dragStart.x;
        cropData.positionY = touch.clientY - dragStart.y;
        updateCropImage();
    });

    document.addEventListener('touchend', function () {
        isDragging = false;
    });

    // Confirm button
    document.getElementById('crop-confirm').addEventListener('click', applyCrop);

    // File input handlers
    document.getElementById('register-pic').addEventListener('change', function () {
        if (this.files[0]) {
            openCropModal('register-pic', 'register-preview');
        }
    });

    document.getElementById('profile-pic-input').addEventListener('change', function () {
        if (this.files[0]) {
            openCropModal('profile-pic-input', 'profile-preview');
        }
    });

    // Crop modal file input
    document.getElementById('crop-file-input').addEventListener('change', function () {
        if (this.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                cropData = {
                    scale: 1,
                    positionX: 0,
                    positionY: 0,
                    image: e.target.result
                };
                document.getElementById('crop-image').src = e.target.result;
                document.getElementById('zoom-range').value = 1;
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
});

function updateCropImage() {
    const img = document.getElementById('crop-image');
    img.style.transform = `translate(${cropData.positionX}px, ${cropData.positionY}px) scale(${cropData.scale})`;
}

// Login Form
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const identifier = form.identifier.value;
    const password = form.password.value;

    // Clear previous errors
    clearFieldErrors();

    // Validate
    const errors = validateLogin({ identifier, password });
    if (errors.length > 0) {
        showToast(errors[0], 'error');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span>Signing in...</span>';

    try {
        await api.login(identifier, password);
        showToast('Welcome back!', 'success');
        currentUser = await api.getMe();
        navigate('dashboard');
    } catch (error) {
        showToast(error.message || 'Invalid credentials', 'error');
        btn.disabled = false;
        btn.innerHTML = '<span>Sign In</span><i class="fas fa-arrow-right"></i>';
    }
});

// Register Form
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');

    // Clear previous errors
    clearFieldErrors();

    const data = {
        firstname: form.firstname.value,
        lastname: form.lastname.value,
        username: form.username.value,
        phone: form.phone.value,
        email: form.email.value || null,
        password: form.password.value
    };

    // Validate
    const errors = validateRegister(data);
    if (errors.length > 0) {
        showToast(errors[0], 'error');
        return;
    }

    // Use JSON if cropped image exists, otherwise use FormData
    let submitData;
    if (window.croppedRegisterPic) {
        data.profilePic = window.croppedRegisterPic;
        submitData = data;
    } else {
        const formData = new FormData();
        formData.append('firstname', data.firstname);
        formData.append('lastname', data.lastname);
        formData.append('username', data.username);
        formData.append('phone', data.phone);
        if (data.email) formData.append('email', data.email);
        formData.append('password', data.password);
        const profilePic = form.querySelector('input[name="profilePic"]').files[0];
        if (profilePic) formData.append('profilePic', profilePic);
        submitData = formData;
    }

    btn.disabled = true;
    btn.innerHTML = '<span>Creating account...</span>';

    try {
        await api.register(submitData);
        window.croppedRegisterPic = null;
        showToast('Account created successfully!', 'success');
        currentUser = await api.getMe();
        navigate('dashboard');
    } catch (error) {
        showToast(error.message || 'Registration failed', 'error');
        btn.disabled = false;
        btn.innerHTML = '<span>Create Account</span><i class="fas fa-user-plus"></i>';
    }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
    const btn = document.getElementById('logout-btn');
    btn.disabled = true;

    try {
        await api.logout();
        currentUser = null;
        window.croppedRegisterPic = null;
        window.croppedProfilePic = null;

        // Reset forms
        document.getElementById('login-form').reset();
        document.getElementById('register-form').reset();
        document.getElementById('register-preview').innerHTML = '';
        document.getElementById('register-preview').classList.remove('has-image');
        document.getElementById('profile-preview').innerHTML = '';
        document.getElementById('profile-preview').classList.remove('has-image');

        // Reset login button
        const loginBtn = document.querySelector('#login-form button[type="submit"]');
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<span>Sign In</span><i class="fas fa-arrow-right"></i>';

        // Reset register button
        const registerBtn = document.querySelector('#register-form button[type="submit"]');
        registerBtn.disabled = false;
        registerBtn.innerHTML = '<span>Create Account</span><i class="fas fa-user-plus"></i>';

        showToast('Logged out successfully', 'success');
        navigate('login');
    } catch (error) {
        showToast('Logout failed', 'error');
    }

    btn.disabled = false;
});

// Dashboard Card Clicks
document.querySelectorAll('.dashboard-card').forEach(card => {
    card.addEventListener('click', () => {
        const action = card.dataset.action;
        // Skip if it's the delete-account card (has its own handler)
        if (action === 'delete-account') return;

        switch (action) {
            case 'profile':
                loadProfile();
                navigate('profile');
                break;
            case 'settings':
                loadSettings();
                navigate('settings');
                break;
            case 'users':
                navigate('users');
                break;
            case 'delete-account':
                openModal('delete-modal');
                break;
        }
    });
});

// Profile Form
document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    // Use JSON if cropped image exists, otherwise use FormData
    let data;
    if (window.croppedProfilePic) {
        data = {
            firstname: document.getElementById('input-firstname').value,
            lastname: document.getElementById('input-lastname').value,
            profilePic: window.croppedProfilePic
        };
    } else {
        const formData = new FormData();
        formData.append('firstname', document.getElementById('input-firstname').value);
        formData.append('lastname', document.getElementById('input-lastname').value);
        const profilePic = form.querySelector('input[name="profilePic"]').files[0];
        if (profilePic) formData.append('profilePic', profilePic);
        data = formData;
    }

    try {
        const response = await api.updateUser(data);

        if (response.success && response.data) {
            window.croppedProfilePic = null;
            currentUser = { data: response.data };
            showToast('Profile updated!', 'success');
            loadProfile();
        } else if (response.status === 403) {
            showToast('Please use Settings to change sensitive fields', 'warning');
        }
    } catch (error) {
        showToast(error.message || 'Update failed', 'error');
    }

    btn.disabled = false;
    btn.innerHTML = originalText;
});

// Change Password Form
document.getElementById('change-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');

    const currentPassword = form.currentPassword.value;
    const newPassword = form.newPassword.value;

    // Validate
    const errors = validateChangePassword({ currentPassword, newPassword });
    if (errors.length > 0) {
        showToast(errors[0], 'error');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

    try {
        await api.changePassword(currentPassword, newPassword);
        showToast('Password changed successfully!', 'success');
        form.reset();
    } catch (error) {
        showToast(error.message || 'Failed to change password', 'error');
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-key"></i> Update Password';
});

// Send Phone Code
document.getElementById('send-phone-code').addEventListener('click', async function () {
    const newPhone = document.getElementById('new-phone').value;

    if (!newPhone) {
        showToast('Please enter a new phone number', 'warning');
        return;
    }

    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
        const response = await api.sendVerificationCode('phone', newPhone);

        if (response.data?._code) {
            // Dev mode - show code
            showToast(`Code: ${response.data._code} (Check console in production)`, 'warning');
        } else {
            showToast('Verification code sent!', 'success');
        }

        document.getElementById('phone-verification-id').value = response.data.verificationId;
        document.getElementById('phone-section').classList.add('hidden');
        document.getElementById('phone-code-section').classList.remove('hidden');
    } catch (error) {
        showToast(error.message || 'Failed to send code', 'error');
    }

    this.disabled = false;
    this.innerHTML = '<i class="fas fa-paper-plane"></i> Send Code';
});

// Verify Phone
document.getElementById('verify-phone-btn').addEventListener('click', async function () {
    const verificationId = document.getElementById('phone-verification-id').value;
    const code = document.getElementById('phone-code').value;

    // Validate code
    const errors = validateVerificationCode(code);
    if (errors.length > 0) {
        showToast(errors[0], 'error');
        return;
    }

    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

    try {
        const response = await api.verifyAndUpdate(verificationId, code);
        showToast('Phone updated successfully!', 'success');

        // Reset UI
        document.getElementById('phone-section').classList.remove('hidden');
        document.getElementById('phone-code-section').classList.add('hidden');
        document.getElementById('new-phone').value = '';
        document.getElementById('phone-code').value = '';

        // Refresh user data
        await refreshUser();
        loadSettings();
    } catch (error) {
        showToast(error.message || 'Verification failed', 'error');
    }

    this.disabled = false;
    this.innerHTML = '<i class="fas fa-check"></i> Verify & Update';
});

// Add Email (no verification needed)
document.getElementById('add-email-btn').addEventListener('click', async function () {
    const email = document.getElementById('new-email').value;

    if (!email) {
        showToast('Please enter an email address', 'warning');
        return;
    }

    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

    try {
        const response = await api.addEmail(email);
        showToast('Email added successfully!', 'success');

        // Refresh user data
        await refreshUser();
        loadSettings();
    } catch (error) {
        showToast(error.message || 'Failed to add email', 'error');
    }

    this.disabled = false;
    this.innerHTML = '<i class="fas fa-plus"></i> Add Email';
});

// Send Email Code (for changing existing email)
document.getElementById('send-email-code').addEventListener('click', async function () {
    const newEmail = document.getElementById('change-email').value;

    if (!newEmail) {
        showToast('Please enter a new email address', 'warning');
        return;
    }

    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    try {
        const response = await api.sendVerificationCode('email', newEmail);

        if (response.data?._code) {
            showToast(`Code: ${response.data._code} (Check console in production)`, 'warning');
        } else {
            showToast('Verification code sent!', 'success');
        }

        document.getElementById('email-verification-id').value = response.data.verificationId;
        document.getElementById('email-section').classList.add('hidden');
        document.getElementById('email-code-section').classList.remove('hidden');
    } catch (error) {
        showToast(error.message || 'Failed to send code', 'error');
    }

    this.disabled = false;
    this.innerHTML = '<i class="fas fa-paper-plane"></i> Send Code';
});

// Verify Email
document.getElementById('verify-email-btn').addEventListener('click', async function () {
    const verificationId = document.getElementById('email-verification-id').value;
    const code = document.getElementById('email-code').value;

    if (!code) {
        showToast('Please enter the verification code', 'warning');
        return;
    }

    this.disabled = true;
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

    try {
        const response = await api.verifyAndUpdate(verificationId, code);
        showToast('Email updated successfully!', 'success');

        // Reset UI
        document.getElementById('email-section').classList.remove('hidden');
        document.getElementById('email-code-section').classList.add('hidden');
        document.getElementById('change-email').value = '';
        document.getElementById('email-code').value = '';

        // Refresh user data
        await refreshUser();
        loadSettings();
    } catch (error) {
        showToast(error.message || 'Verification failed', 'error');
    }

    this.disabled = false;
    this.innerHTML = '<i class="fas fa-check"></i> Verify & Update';
});

// Delete Account Form
document.getElementById('delete-account-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const password = form.password.value;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';

    try {
        await api.deleteAccount(password);
        showToast('Account deleted successfully', 'success');
        closeModal('delete-modal');

        // Reset everything
        currentUser = null;
        window.croppedRegisterPic = null;
        window.croppedProfilePic = null;

        // Reset all forms
        document.querySelectorAll('form').forEach(f => f.reset());

        // Reset all buttons
        document.querySelectorAll('button[type="submit"]').forEach(btn => {
            btn.disabled = false;
        });
        const loginBtn = document.querySelector('#login-form button[type="submit"]');
        if (loginBtn) loginBtn.innerHTML = '<span>Sign In</span><i class="fas fa-arrow-right"></i>';
        const registerBtn = document.querySelector('#register-form button[type="submit"]');
        if (registerBtn) registerBtn.innerHTML = '<span>Create Account</span><i class="fas fa-user-plus"></i>';

        // Reset previews
        document.getElementById('register-preview').innerHTML = '';
        document.getElementById('register-preview').classList.remove('has-image');
        document.getElementById('profile-preview').innerHTML = '';
        document.getElementById('profile-preview').classList.remove('has-image');

        navigate('login');
    } catch (error) {
        showToast(error.message || 'Failed to delete account', 'error');
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-trash"></i> Delete Account';
});

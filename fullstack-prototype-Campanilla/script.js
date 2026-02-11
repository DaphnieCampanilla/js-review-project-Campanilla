// ============================================
// FULL-STACK PROTOTYPE - COMPLETE IMPLEMENTATION
// Following the PDF Guide Phases
// ============================================

const STORAGE_KEY = 'ipt_demo_v1';
let window_db = { accounts: [], departments: [], employees: [], requests: [] };
let currentUser = null;

// ============================================
// PHASE 4: PERSISTENCE & INITIALIZATION
// ============================================

function loadFromStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        try {
            window_db = JSON.parse(data);
        } catch (e) {
            console.error('Error parsing storage data:', e);
            seedDatabase();
        }
    } else {
        seedDatabase();
    }
}

function seedDatabase() {
    // Seed with admin account
    window_db.accounts = [{
        id: Date.now(),
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'Password123!',
        role: 'Admin',
        verified: true
    }];
    
    // Seed departments
    window_db.departments = [
        { id: 1, name: 'Engineering', desc: 'Software team' },
        { id: 2, name: 'HR', desc: 'People team' }
    ];
    
    window_db.employees = [];
    window_db.requests = [];
    
    saveToStorage();
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window_db));
}

function init() {
    loadFromStorage();
    
    // Debug: Log the accounts to console
    console.log('=== DATABASE LOADED ===');
    console.log('Accounts:', window_db.accounts);
    console.log('Storage Key:', STORAGE_KEY);
    console.log('=======================');
    
    // Check for auth token
    const token = localStorage.getItem('auth_token');
    if (token) {
        const user = window_db.accounts.find(a => a.email === token && a.verified);
        if (user) {
            setAuthState(true, user);
        } else {
            localStorage.removeItem('auth_token');
        }
    }
    
    handleRouting();
}

// ============================================
// PHASE 2: ROUTING LOGIC
// ============================================

function navigateTo(hash) {
    window.location.hash = hash;
}

function handleRouting() {
    let hash = window.location.hash || '#/';
    
    // On page load, set hash to #/ if empty
    if (!window.location.hash) {
        window.location.hash = '#/';
        hash = '#/';
    }
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Protected routes
    const protectedRoutes = ['#/profile', '#/requests', '#/employees', '#/accounts', '#/departments'];
    if (protectedRoutes.includes(hash) && !currentUser) {
        window.location.hash = '#/login';
        return;
    }
    
    // Admin-only routes
    const adminRoutes = ['#/employees', '#/accounts', '#/departments'];
    if (adminRoutes.includes(hash) && currentUser && currentUser.role !== 'Admin') {
        alert('Access denied. Admin only.');
        window.location.hash = '#/';
        return;
    }

    // Map hash to page ID
    const pageId = hash === '#/' ? 'home-page' : hash.replace('#/', '') + '-page';
    const target = document.getElementById(pageId);
    
    if (target) {
        target.classList.add('active');
        
        // Call render functions for specific pages
        if (hash === '#/profile') renderProfile();
        if (hash === '#/accounts') renderAccounts();
        if (hash === '#/employees') renderEmployeesTable();
        if (hash === '#/departments') renderDepartments();
        if (hash === '#/requests') renderMyRequests();
    } else {
        // Page not found, go home
        window.location.hash = '#/';
    }
}

window.addEventListener('hashchange', handleRouting);

// ============================================
// PHASE 3: AUTHENTICATION SYSTEM
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    
    // REGISTRATION FORM
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;
            const firstName = document.getElementById('reg-firstname').value.trim();
            const lastName = document.getElementById('reg-lastname').value.trim();
            
            // Check if email already exists
            if (window_db.accounts.find(a => a.email === email)) {
                alert('Email already exists! Please use a different email.');
                return;
            }
            
            // Validate password (min 6 chars)
            if (password.length < 6) {
                alert('Password must be at least 6 characters long.');
                return;
            }
            
            // Create new account with verified: false
            const newAccount = {
                id: Date.now(),
                firstName,
                lastName,
                email,
                password,
                role: 'User',
                verified: false  // Not verified yet
            };
            
            window_db.accounts.push(newAccount);
            saveToStorage();
            
            // Store unverified email for verification page
            localStorage.setItem('unverified_email', email);
            
            // Navigate to verify email page
            window.location.hash = '#/verify-email';
            
            // Display email on verify page
            setTimeout(() => {
                const emailDisplay = document.getElementById('verify-email-display');
                if (emailDisplay) emailDisplay.textContent = email;
            }, 100);
        });
    }
    
    // LOGIN FORM
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            
            // Find user with matching credentials
            const user = window_db.accounts.find(a => 
                a.email === email && 
                a.password === password &&
                a.verified === true
            );
            
            if (user) {
                // Save auth token
                localStorage.setItem('auth_token', user.email);
                setAuthState(true, user);
                alert('Login successful!');
                window.location.hash = '#/profile';
            } else {
                // Check if user exists but not verified
                const unverifiedUser = window_db.accounts.find(a => 
                    a.email === email && a.password === password
                );
                
                if (unverifiedUser && !unverifiedUser.verified) {
                    alert('Please verify your email first.');
                } else {
                    alert('Invalid email or password.');
                }
            }
        });
    }
    
    // LOGOUT BUTTON
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    
    init();
});

// EMAIL VERIFICATION SIMULATION
function simulateVerification() {
    const email = localStorage.getItem('unverified_email');
    if (!email) {
        alert('No pending verification found.');
        return;
    }
    
    // Find the account and set verified to true
    const account = window_db.accounts.find(a => a.email === email);
    if (account) {
        account.verified = true;
        saveToStorage();
        localStorage.removeItem('unverified_email');
        alert('Email verified! Please login.');
        
        // Show success message on login page
        window.location.hash = '#/login';
        setTimeout(() => {
            const successMsg = document.getElementById('login-success-msg');
            if (successMsg) {
                successMsg.classList.remove('d-none');
                setTimeout(() => successMsg.classList.add('d-none'), 5000);
            }
        }, 100);
    }
}

// AUTH STATE MANAGEMENT
function setAuthState(isAuth, user) {
    currentUser = isAuth ? user : null;
    const body = document.body;
    const dropdownText = document.getElementById('user-display-name');
    
    if (isAuth) {
        body.classList.remove('not-authenticated');
        body.classList.add('authenticated');
        
        if (dropdownText) {
            dropdownText.innerText = user.role === 'Admin' ? 'Admin' : user.firstName;
        }
        
        if (user.role === 'Admin') {
            body.classList.add('is-admin');
        } else {
            body.classList.remove('is-admin');
        }
    } else {
        body.classList.remove('authenticated', 'is-admin');
        body.classList.add('not-authenticated');
        if (dropdownText) dropdownText.innerText = 'Account';
        localStorage.removeItem('auth_token');
    }
}

function logout() {
    setAuthState(false);
    window.location.hash = '#/';
}

// RESET DATABASE FUNCTION (for testing)
function resetDatabase() {
    if (confirm('This will delete all data and reset to defaults. Continue?')) {
        localStorage.clear();
        alert('Database reset! Page will reload.');
        window.location.reload();
    }
}

// ============================================
// PHASE 5: PROFILE VIEW
// ============================================

function renderProfile() {
    const nameEl = document.getElementById('prof-name');
    const emailEl = document.getElementById('prof-email');
    const roleEl = document.getElementById('prof-role');
    
    if (currentUser && nameEl) {
        nameEl.innerText = `${currentUser.firstName} ${currentUser.lastName}`;
        emailEl.innerText = currentUser.email;
        roleEl.innerText = currentUser.role;
    }
}

// ============================================
// PHASE 6: ADMIN FEATURES - ACCOUNTS
// ============================================

function renderAccounts() {
    const tbody = document.getElementById('accounts-table-body');
    if (!tbody) return;
    
    if (window_db.accounts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No accounts found.</td></tr>';
        return;
    }
    
    tbody.innerHTML = window_db.accounts.map(acc => `
        <tr>
            <td>${acc.firstName} ${acc.lastName}</td>
            <td>${acc.email}</td>
            <td>${acc.role}</td>
            <td>${acc.verified ? '✅' : '❌'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editAccount('${acc.email}')">Edit</button>
                <button class="btn btn-sm btn-outline-warning" onclick="resetPassword('${acc.email}')">Reset PW</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteAccount('${acc.email}')" 
                    ${acc.email === currentUser.email ? 'disabled' : ''}>Delete</button>
            </td>
        </tr>
    `).join('');
}

// Add Account Button
document.addEventListener('DOMContentLoaded', () => {
    const addAccountBtn = document.getElementById('add-account-btn');
    if (addAccountBtn) {
        addAccountBtn.addEventListener('click', () => {
            showAccountForm();
        });
    }
    
    const cancelAccBtn = document.getElementById('cancel-acc-btn');
    if (cancelAccBtn) {
        cancelAccBtn.addEventListener('click', () => {
            hideAccountForm();
        });
    }
    
    const accountForm = document.getElementById('account-form');
    if (accountForm) {
        accountForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveAccount();
        });
    }
});

function showAccountForm(email = null) {
    const container = document.getElementById('account-form-container');
    const title = document.getElementById('account-form-title');
    const originalEmailInput = document.getElementById('edit-original-email');
    const passwordGroup = document.getElementById('password-field-group');
    const passwordInput = document.getElementById('acc-password');
    
    if (email) {
        // Edit mode
        const account = window_db.accounts.find(a => a.email === email);
        if (!account) return;
        
        title.textContent = 'Edit Account';
        document.getElementById('acc-firstname').value = account.firstName;
        document.getElementById('acc-lastname').value = account.lastName;
        document.getElementById('acc-email').value = account.email;
        document.getElementById('acc-role').value = account.role;
        document.getElementById('acc-verified').checked = account.verified;
        originalEmailInput.value = email;
        
        // Hide password field in edit mode
        passwordGroup.classList.add('d-none');
        passwordInput.required = false;
    } else {
        // Add mode
        title.textContent = 'Add Account';
        document.getElementById('account-form').reset();
        originalEmailInput.value = '';
        
        // Show password field in add mode
        passwordGroup.classList.remove('d-none');
        passwordInput.required = true;
    }
    
    container.classList.remove('d-none');
}

function hideAccountForm() {
    const container = document.getElementById('account-form-container');
    container.classList.add('d-none');
    document.getElementById('account-form').reset();
}

function saveAccount() {
    const originalEmail = document.getElementById('edit-original-email').value;
    const firstName = document.getElementById('acc-firstname').value.trim();
    const lastName = document.getElementById('acc-lastname').value.trim();
    const email = document.getElementById('acc-email').value.trim();
    const password = document.getElementById('acc-password').value;
    const role = document.getElementById('acc-role').value;
    const verified = document.getElementById('acc-verified').checked;
    
    if (originalEmail) {
        // Edit existing account
        const account = window_db.accounts.find(a => a.email === originalEmail);
        if (!account) return;
        
        // Check if email changed and new email already exists
        if (email !== originalEmail && window_db.accounts.find(a => a.email === email)) {
            alert('Email already exists!');
            return;
        }
        
        account.firstName = firstName;
        account.lastName = lastName;
        account.email = email;
        account.role = role;
        account.verified = verified;
        
        // Update auth token if editing current user
        if (originalEmail === currentUser.email) {
            localStorage.setItem('auth_token', email);
            currentUser.email = email;
        }
    } else {
        // Add new account
        if (window_db.accounts.find(a => a.email === email)) {
            alert('Email already exists!');
            return;
        }
        
        if (password.length < 6) {
            alert('Password must be at least 6 characters long.');
            return;
        }
        
        const newAccount = {
            id: Date.now(),
            firstName,
            lastName,
            email,
            password,
            role,
            verified
        };
        
        window_db.accounts.push(newAccount);
    }
    
    saveToStorage();
    hideAccountForm();
    renderAccounts();
    alert('Account saved successfully!');
}

function editAccount(email) {
    showAccountForm(email);
}

function resetPassword(email) {
    const newPassword = prompt('Enter new password (min 6 characters):');
    if (!newPassword) return;
    
    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
    }
    
    const account = window_db.accounts.find(a => a.email === email);
    if (account) {
        account.password = newPassword;
        saveToStorage();
        alert('Password reset successfully!');
    }
}

function deleteAccount(email) {
    if (email === currentUser.email) {
        alert('You cannot delete your own account!');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete ${email}?`)) return;
    
    window_db.accounts = window_db.accounts.filter(a => a.email !== email);
    saveToStorage();
    renderAccounts();
    alert('Account deleted successfully!');
}

// ============================================
// PHASE 6: ADMIN FEATURES - DEPARTMENTS
// ============================================

function renderDepartments() {
    const tbody = document.getElementById('departments-table-body');
    if (!tbody) return;
    
    if (window_db.departments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No departments found.</td></tr>';
        return;
    }
    
    tbody.innerHTML = window_db.departments.map(dept => `
        <tr>
            <td>${dept.name}</td>
            <td>${dept.desc}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editDepartment(${dept.id})">Edit</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteDepartment(${dept.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const addDeptBtn = document.getElementById('add-dept-btn');
    if (addDeptBtn) {
        addDeptBtn.addEventListener('click', () => {
            showDeptForm();
        });
    }
    
    const cancelDeptBtn = document.getElementById('cancel-dept-btn');
    if (cancelDeptBtn) {
        cancelDeptBtn.addEventListener('click', () => {
            hideDeptForm();
        });
    }
    
    const deptForm = document.getElementById('dept-form');
    if (deptForm) {
        deptForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveDepartment();
        });
    }
});

function showDeptForm(id = null) {
    const container = document.getElementById('dept-form-container');
    const idInput = document.getElementById('edit-dept-id');
    
    if (id) {
        // Edit mode
        const dept = window_db.departments.find(d => d.id === id);
        if (!dept) return;
        
        document.getElementById('dept-name').value = dept.name;
        document.getElementById('dept-desc').value = dept.desc;
        idInput.value = id;
    } else {
        // Add mode
        document.getElementById('dept-form').reset();
        idInput.value = '';
    }
    
    container.classList.remove('d-none');
}

function hideDeptForm() {
    const container = document.getElementById('dept-form-container');
    container.classList.add('d-none');
    document.getElementById('dept-form').reset();
}

function saveDepartment() {
    const id = document.getElementById('edit-dept-id').value;
    const name = document.getElementById('dept-name').value.trim();
    const desc = document.getElementById('dept-desc').value.trim();
    
    if (id) {
        // Edit existing
        const dept = window_db.departments.find(d => d.id === parseInt(id));
        if (dept) {
            dept.name = name;
            dept.desc = desc;
        }
    } else {
        // Add new
        const newDept = {
            id: Date.now(),
            name,
            desc
        };
        window_db.departments.push(newDept);
    }
    
    saveToStorage();
    hideDeptForm();
    renderDepartments();
    populateDeptDropdown(); // Update dropdowns
    alert('Department saved successfully!');
}

function editDepartment(id) {
    showDeptForm(id);
}

function deleteDepartment(id) {
    if (!confirm('Are you sure you want to delete this department?')) return;
    
    window_db.departments = window_db.departments.filter(d => d.id !== id);
    saveToStorage();
    renderDepartments();
    populateDeptDropdown();
    alert('Department deleted successfully!');
}

// ============================================
// PHASE 6: ADMIN FEATURES - EMPLOYEES
// ============================================

function renderEmployeesTable() {
    const tbody = document.getElementById('employees-table-body');
    if (!tbody) return;
    
    populateDeptDropdown(); // Ensure dropdown is populated
    
    if (window_db.employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No employees.</td></tr>';
        return;
    }
    
    tbody.innerHTML = window_db.employees.map((emp, index) => {
        const user = window_db.accounts.find(a => a.email === emp.userEmail);
        const userName = user ? `${user.firstName} ${user.lastName}` : emp.userEmail;
        
        return `
            <tr>
                <td>${emp.employeeId}</td>
                <td>${userName}</td>
                <td>${emp.position}</td>
                <td>${emp.department}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editEmployee(${index})">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee(${index})">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function populateDeptDropdown() {
    const deptSelect = document.getElementById('emp-dept');
    if (!deptSelect) return;
    
    deptSelect.innerHTML = '<option value="">Select Department</option>' +
        window_db.departments.map(dept => `<option value="${dept.name}">${dept.name}</option>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const addEmployeeBtn = document.getElementById('add-employee-btn');
    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener('click', () => {
            showEmployeeForm();
        });
    }
    
    const cancelEmpBtn = document.getElementById('cancel-emp-btn');
    if (cancelEmpBtn) {
        cancelEmpBtn.addEventListener('click', () => {
            hideEmployeeForm();
        });
    }
    
    const employeeForm = document.getElementById('employee-form');
    if (employeeForm) {
        employeeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveEmployee();
        });
    }
});

function showEmployeeForm(index = null) {
    const container = document.getElementById('employee-form-container');
    const indexInput = document.getElementById('edit-employee-index');
    
    populateDeptDropdown();
    
    if (index !== null) {
        // Edit mode
        const emp = window_db.employees[index];
        if (!emp) return;
        
        document.getElementById('emp-id').value = emp.employeeId;
        document.getElementById('emp-email').value = emp.userEmail;
        document.getElementById('emp-pos').value = emp.position;
        document.getElementById('emp-dept').value = emp.department;
        document.getElementById('emp-date').value = emp.hireDate;
        indexInput.value = index;
    } else {
        // Add mode
        document.getElementById('employee-form').reset();
        indexInput.value = '';
    }
    
    container.classList.remove('d-none');
}

function hideEmployeeForm() {
    const container = document.getElementById('employee-form-container');
    container.classList.add('d-none');
    document.getElementById('employee-form').reset();
}

function saveEmployee() {
    const index = document.getElementById('edit-employee-index').value;
    const employeeId = document.getElementById('emp-id').value.trim();
    const userEmail = document.getElementById('emp-email').value.trim();
    const position = document.getElementById('emp-pos').value.trim();
    const department = document.getElementById('emp-dept').value;
    const hireDate = document.getElementById('emp-date').value;
    
    // Validate that user exists
    const userExists = window_db.accounts.find(a => a.email === userEmail);
    if (!userExists) {
        alert('User with this email does not exist! Please create an account first.');
        return;
    }
    
    if (index !== '') {
        // Edit existing
        const emp = window_db.employees[parseInt(index)];
        if (emp) {
            emp.employeeId = employeeId;
            emp.userEmail = userEmail;
            emp.position = position;
            emp.department = department;
            emp.hireDate = hireDate;
        }
    } else {
        // Add new
        const newEmployee = {
            id: Date.now(),
            employeeId,
            userEmail,
            position,
            department,
            hireDate
        };
        window_db.employees.push(newEmployee);
    }
    
    saveToStorage();
    hideEmployeeForm();
    renderEmployeesTable();
    alert('Employee saved successfully!');
}

function editEmployee(index) {
    showEmployeeForm(index);
}

function deleteEmployee(index) {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    
    window_db.employees.splice(index, 1);
    saveToStorage();
    renderEmployeesTable();
    alert('Employee deleted successfully!');
}

// ============================================
// PHASE 7: USER REQUESTS
// ============================================

function renderMyRequests() {
    if (!currentUser) return;
    
    const userRequests = window_db.requests.filter(r => r.employeeEmail === currentUser.email);
    const emptyDiv = document.getElementById('requests-empty');
    const tableContainer = document.getElementById('requests-table-container');
    const tbody = document.getElementById('requests-table-body');
    
    if (userRequests.length === 0) {
        emptyDiv.classList.remove('d-none');
        tableContainer.classList.add('d-none');
    } else {
        emptyDiv.classList.add('d-none');
        tableContainer.classList.remove('d-none');
        
        tbody.innerHTML = userRequests.map(req => {
            const badgeClass = req.status === 'Pending' ? 'bg-warning' : 
                               req.status === 'Approved' ? 'bg-success' : 'bg-danger';
            
            const itemsList = req.items.map(item => `${item.name} (${item.qty})`).join(', ');
            
            return `
                <tr>
                    <td>${req.date}</td>
                    <td>${req.type}</td>
                    <td>${itemsList}</td>
                    <td><span class="badge ${badgeClass}">${req.status}</span></td>
                </tr>
            `;
        }).join('');
    }
}

// Dynamic items management
document.addEventListener('DOMContentLoaded', () => {
    const addItemBtn = document.getElementById('add-item-btn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', () => {
            addItemRow();
        });
    }
    
    const requestForm = document.getElementById('request-form');
    if (requestForm) {
        requestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitRequest();
        });
    }
    
    // Add initial item row
    addItemRow();
});

function addItemRow() {
    const container = document.getElementById('dynamic-items-list');
    const rowId = 'item-' + Date.now();
    
    const row = document.createElement('div');
    row.className = 'input-group mb-2';
    row.id = rowId;
    row.innerHTML = `
        <input type="text" class="form-control" placeholder="Item name" required>
        <input type="number" class="form-control" placeholder="Qty" min="1" value="1" required style="max-width: 100px;">
        <button type="button" class="btn btn-outline-danger" onclick="removeItemRow('${rowId}')">×</button>
    `;
    
    container.appendChild(row);
}

function removeItemRow(rowId) {
    const row = document.getElementById(rowId);
    if (row) {
        const container = document.getElementById('dynamic-items-list');
        // Ensure at least one row remains
        if (container.children.length > 1) {
            row.remove();
        } else {
            alert('At least one item is required.');
        }
    }
}

function submitRequest() {
    const type = document.getElementById('req-type').value;
    const itemRows = document.querySelectorAll('#dynamic-items-list .input-group');
    
    if (itemRows.length === 0) {
        alert('Please add at least one item.');
        return;
    }
    
    const items = [];
    itemRows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const name = inputs[0].value.trim();
        const qty = parseInt(inputs[1].value);
        
        if (name && qty > 0) {
            items.push({ name, qty });
        }
    });
    
    if (items.length === 0) {
        alert('Please enter valid items.');
        return;
    }
    
    const newRequest = {
        id: Date.now(),
        employeeEmail: currentUser.email,
        type,
        items,
        status: 'Pending',
        date: new Date().toLocaleDateString()
    };
    
    window_db.requests.push(newRequest);
    saveToStorage();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('requestModal'));
    if (modal) modal.hide();
    
    // Clear form
    document.getElementById('request-form').reset();
    document.getElementById('dynamic-items-list').innerHTML = '';
    addItemRow();
    
    // Refresh requests view
    renderMyRequests();
    
    alert('Request submitted successfully!');
}


window.onload = init;
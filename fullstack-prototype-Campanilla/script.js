const STORAGE_KEY = 'ipt_demo_v1';
let window_db = { accounts: [], departments: [], employees: [], requests: [] };
let currentUser = null;


function init() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        window_db = JSON.parse(data);
    } else {

        window_db.accounts.push({
            id: Date.now(),
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@example.com',
            password: 'Password123!',
            role: 'admin',
            verified: true
        });
        saveToStorage();
    }
    
    const token = localStorage.getItem('auth_token');
    if (token) {
        const user = window_db.accounts.find(a => a.email === token);
        if (user) setAuthState(true, user);
    }
    
    handleRouting();
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window_db)); // [cite: 140, 495]
}

function handleRouting() {
    const hash = window.location.hash || '#/';
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    const protectedRoutes = ['#/profile', '#/requests', '#/employees', '#/accounts'];
    if (protectedRoutes.includes(hash) && !currentUser) {
        window.location.hash = '#/login';
        return;
    }

    const adminRoutes = ['#/employees', '#/accounts', '#/departments'];
    if (adminRoutes.includes(hash) && currentUser?.role !== 'admin') {
        window.location.hash = '#/';
        return;
    }

    const pageId = hash === '#/' ? 'home-page' : hash.replace('#/', '') + '-page';
    const target = document.getElementById(pageId);
    if (target) {
        target.classList.add('active');
        if (hash === '#/profile') renderProfile();
        if (hash === '#/accounts') renderAccounts();
    }
}

window.addEventListener('hashchange', handleRouting); // [cite: 72, 451]

document.getElementById('register-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value;
    
    if (window_db.accounts.find(a => a.email === email)) return alert("Email exists!"); // [cite: 459]

    const newUser = {
        id: Date.now(),
        firstName: document.getElementById('reg-fn').value,
        lastName: document.getElementById('reg-ln').value,
        email: email,
        password: document.getElementById('reg-pw').value,
        role: 'user',
        verified: false
    };

    window_db.accounts.push(newUser);
    localStorage.setItem('unverified_email', email); // [cite: 97, 460]
    saveToStorage();
    window.location.hash = '#/verify-email';
});

function simulateVerification() {
    const email = localStorage.getItem('unverified_email');
    const acc = window_db.accounts.find(a => a.email === email);
    if (acc) {
        acc.verified = true; // [cite: 102, 467]
        saveToStorage();
        document.getElementById('verify-alert').classList.remove('d-none');
        window.location.hash = '#/login';
    }
}

document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pw = document.getElementById('login-pw').value;

    const user = window_db.accounts.find(a => a.email === email && a.password === pw && a.verified); // [cite: 114, 473]

    if (user) {
        localStorage.setItem('auth_token', user.email); // [cite: 118, 474]
        setAuthState(true, user);
        window.location.hash = '#/profile';
    } else {
        alert("Invalid credentials or unverified email.");
    }
});

function setAuthState(isAuth, user) {
    currentUser = isAuth ? user : null;
    const body = document.body;
    
    if (isAuth) {
        body.classList.replace('not-authenticated', 'authenticated'); // [cite: 122, 123]
        if (user.role === 'admin') body.classList.add('is-admin'); // [cite: 125, 482]
    } else {
        body.className = 'not-authenticated';
        localStorage.removeItem('auth_token');
    }
}

function logout() {
    setAuthState(false);
    window.location.hash = '#/';
}


function renderProfile() {
    const container = document.getElementById('profile-details');
    container.innerHTML = `
        <h4>${currentUser.firstName} ${currentUser.lastName}</h4>
        <p>Email: ${currentUser.email}</p>
        <p>Role: <span class="badge bg-info">${currentUser.role}</span></p>
    `;
}

function renderAccounts() {
    const list = document.getElementById('accounts-list');
    list.innerHTML = window_db.accounts.map(acc => `
        <tr>
            <td>${acc.firstName} ${acc.lastName}</td>
            <td>${acc.email}</td>
            <td>${acc.role}</td>
            <td>${acc.verified ? '✅' : '❌'}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteAccount(${acc.id})" 
                ${acc.email === currentUser.email ? 'disabled' : ''}>Delete</button>
            </td>
        </tr>
    `).join('');
}

function deleteAccount(id) {
    if (confirm("Delete this user?")) {
        window_db.accounts = window_db.accounts.filter(a => a.id !== id);
        saveToStorage();
        renderAccounts();
    }
}

init();
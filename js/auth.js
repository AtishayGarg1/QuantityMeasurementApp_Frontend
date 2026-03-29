// Auth service using Fetch API
async function login(email, password) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('qma_token', data.token);
            localStorage.setItem('user_email', email);
            return { success: true };
        } else {
            return { success: false, message: 'Invalid credentials' };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Server connection failed' };
    }
}
 
async function register(email, password) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            return { success: true };
        } else {
            const data = await response.json();
            return { success: false, message: data.message || 'Registration failed' };
        }
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, message: 'Server connection failed' };
    }
}

function logout() {
    localStorage.removeItem('qma_token');
    localStorage.removeItem('user_email');
    window.location.href = 'index.html';
}

function checkAuth() {
    const token = localStorage.getItem('qma_token');
    if (!token && !window.location.pathname.includes('index.html') && !window.location.pathname.includes('signup.html')) {
        window.location.href = 'index.html';
    }
    return token;
}

// 检查登录状态
async function checkAuthStatus() {
    try {
        const response = await fetch('/.netlify/functions/auth-login', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const user = await response.json();
            showDashboard(user.email);
        }
    } catch (error) {
        console.error('检查登录状态失败:', error);
    }
}

// 显示仪表板
function showDashboard(email) {
    document.getElementById('authContainer').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('userEmail').textContent = email;
}

// 登录
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const message = document.getElementById('loginMessage');
    
    try {
        const response = await fetch('/.netlify/functions/auth-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            message.textContent = '登录成功！';
            message.className = 'message success';
            setTimeout(() => showDashboard(data.email), 1000);
        } else {
            message.textContent = data.error || '登录失败';
            message.className = 'message error';
        }
    } catch (error) {
        message.textContent = '网络错误，请重试';
        message.className = 'message error';
    }
});

// 注册
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const message = document.getElementById('signupMessage');
    
    try {
        const response = await fetch('/.netlify/functions/auth-signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            message.textContent = '注册成功，请登录';
            message.className = 'message success';
            // 切换到登录标签
            document.querySelector('[data-tab="login"]').click();
            document.getElementById('loginEmail').value = email;
        } else {
            message.textContent = data.error || '注册失败';
            message.className = 'message error';
        }
    } catch (error) {
        message.textContent = '网络错误，请重试';
        message.className = 'message error';
    }
});

// 退出登录
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/.netlify/functions/auth-login', {
        method: 'DELETE',
        credentials: 'include'
    });
    location.reload();
});

// 标签切换
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const tab = button.dataset.tab;
        
        // 更新按钮状态
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // 显示对应表单
        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
        document.getElementById(`${tab}Form`).classList.add('active');
    });
});

// 页面加载时检查登录状态
checkAuthStatus();
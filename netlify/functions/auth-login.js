// netlify/functions/auth-login.js
exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { email, password } = JSON.parse(event.body);

        if (!email || !password) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: '邮箱和密码不能为空' })
            };
        }

        // 使用 Netlify Identity 的 /token 接口进行登录
        const response = await fetch(`${process.env.URL}/.netlify/identity/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                grant_type: 'password',
                username: email,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // 处理常见错误
            if (data.error === 'invalid_grant') {
                return {
                    statusCode: 401,
                    body: JSON.stringify({ error: '邮箱或密码错误' })
                };
            }
            throw new Error(data.error_description || data.msg || '登录失败');
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: '登录成功',
                access_token: data.access_token,
                expires_at: data.expires_at
            })
        };

    } catch (error) {
        console.error('登录错误:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message || '服务器内部错误',
                details: error.toString()
            })
        };
    }
};
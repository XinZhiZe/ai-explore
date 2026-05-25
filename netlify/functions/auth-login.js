// netlify/functions/auth-login.js
exports.handler = async (event, context) => {
    // 只允许 POST 请求
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        // 解析请求体
        const { email, password } = JSON.parse(event.body);

        // 验证必填字段
        if (!email || !password) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: '邮箱和密码不能为空' })
            };
        }

        // 调用 Netlify Identity 的 /token 接口进行登录
        const response = await fetch(
            `${process.env.URL}/.netlify/identity/token`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );

        // 解析响应
        const data = await response.json();

        // 如果响应不成功（非 2xx）
        if (!response.ok) {
            // 401 表示认证失败（邮箱或密码错误）
            if (response.status === 401) {
                return {
                    statusCode: 401,
                    body: JSON.stringify({ error: '邮箱或密码错误' })
                };
            }
            // 其他错误（如 400、500）
            throw new Error(data.error_description || data.msg || '登录失败');
        }

        // 登录成功，返回 token 和用户信息
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: '登录成功',
                token: data.token,
                user: data.user
            })
        };

    } catch (error) {
        console.error('登录错误:', error);

        // 返回 500 服务器错误
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message || '服务器内部错误',
                details: error.toString()
            })
        };
    }
};
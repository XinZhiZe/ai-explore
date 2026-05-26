// netlify/functions/auth-login.js
exports.handler = async (event, context) => {
    // 1. 只允许 POST 请求
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        // 2. 解析前端传来的数据
        const { email, password } = JSON.parse(event.body);

        // 3. 简单校验
        if (!email || !password) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: '邮箱和密码不能为空' })
            };
        }

        // 4. 调用 Netlify Identity 的登录接口
        // 注意：URL 里的 YOUR_NETLIFY_SITE_URL 要替换成你真实的 Netlify 域名
        // 例如：https://your-site-name.netlify.app/.netlify/identity/token
        const identityUrl = `${process.env.URL}/.netlify/identity/token`; 
        
        const response = await fetch(identityUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password，
		grant_type: 'password'
            })
        });

        const data = await response.json();

        // 5. 处理登录结果
        if (!response.ok) {
            // 如果 Identity 返回错误（比如密码错、用户不存在），返回 401
            return {
                statusCode: 401,
                body: JSON.stringify({ error: data.error_description || data.error || '登录失败' })
            };
        }

        // 6. 登录成功，返回 token 等信息
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };

    } catch (error) {
        // 7. 捕获所有意外错误（比如 JSON 解析失败）
        console.error("Login function error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: '服务器内部错误', details: error.message })
        };
    }
};
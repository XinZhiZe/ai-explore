const createClient = require('@netlify/identity');

exports.handler = async (event, context) => {
    const identity = createClient({
        siteURL: process.env.NETLIFY_IDENTITY_URL || process.env.URL,
        token: process.env.NETLIFY_AUTH_TOKEN
    });
    
    // GET 请求：检查当前登录状态
    if (event.httpMethod === 'GET') {
        try {
            // 从 cookie 中获取用户
            const user = await identity.getUser(event);
            if (user) {
                return {
                    statusCode: 200,
                    body: JSON.stringify({ email: user.email })
                };
            } else {
                return { statusCode: 401, body: JSON.stringify({ error: '未登录' }) };
            }
        } catch (error) {
            return { statusCode: 401, body: JSON.stringify({ error: '未登录' }) };
        }
    }
    
    // POST 请求：登录
    if (event.httpMethod === 'POST') {
        try {
            const { email, password } = JSON.parse(event.body);
            
            if (!email || !password) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: '邮箱和密码不能为空' })
                };
            }
            
            // 登录验证
            const user = await identity.login(email, password);
            
            if (user) {
                // 设置登录 cookie
                const token = identity.createToken(user);
                const cookie = identity.serializeToken(token);
                
                return {
                    statusCode: 200,
                    headers: {
                        'Set-Cookie': cookie,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: user.email })
                };
            } else {
                return {
                    statusCode: 401,
                    body: JSON.stringify({ error: '邮箱或密码错误' })
                };
            }
        } catch (error) {
            console.error('登录错误:', error);
            return {
                statusCode: 401,
                body: JSON.stringify({ error: '登录失败，请检查邮箱和密码' })
            };
        }
    }
    
    // DELETE 请求：退出登录
    if (event.httpMethod === 'DELETE') {
        return {
            statusCode: 200,
            headers: {
                'Set-Cookie': 'nf_jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
            },
            body: JSON.stringify({ message: '已退出登录' })
        };
    }
    
    return { statusCode: 405, body: 'Method Not Allowed' };
};
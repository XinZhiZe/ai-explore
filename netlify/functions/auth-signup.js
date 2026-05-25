const { createClient } = require('@netlify/identity');

exports.handler = async (event, context) => {
    // 只允许 POST 请求
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    try {
        const { email, password } = JSON.parse(event.body);
        
        // 参数验证
        if (!email || !password) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: '邮箱和密码不能为空' })
            };
        }
        
        if (password.length < 6) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: '密码至少6位' })
            };
        }
        
        // 创建 Netlify Identity 客户端
        const identity = createClient({
            siteURL: process.env.NETLIFY_IDENTITY_URL || process.env.URL,
            token: process.env.NETLIFY_AUTH_TOKEN
        });
        
        // 注册用户（Netlify Identity 会自动发送确认邮件）
        const user = await identity.signup(email, password);
        
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                message: '注册成功，请查收确认邮件',
                email: user.email 
            })
        };
    } catch (error) {
        console.error('注册错误:', error);
        
        // 处理邮箱已存在等错误
        if (error.message.includes('already exists')) {
            return {
                statusCode: 409,
                body: JSON.stringify({ error: '该邮箱已被注册' })
            };
        }
        
        return {
            statusCode: 500,
            body: JSON.stringify({ error: '服务器内部错误' })
        };
    }
};
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
        
        if (password.length < 6) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: '密码至少6位' })
            };
        }
        
        // 使用原生 fetch 调用 Netlify Identity API
        const response = await fetch(`${process.env.URL}/.netlify/identity/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error_description || data.msg || '注册失败');
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                message: '注册成功，请查收确认邮件',
                email: data.email
            })
        };
    } catch (error) {
        console.error('注册错误:', error);
        
        if (error.message.includes('already exists') || error.message.includes('already registered')) {
            return {
                statusCode: 409,
                body: JSON.stringify({ error: '该邮箱已被注册' })
            };
        }
        
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: error.message || '服务器内部错误',
                details: error.toString()
            })
        };
    }
};
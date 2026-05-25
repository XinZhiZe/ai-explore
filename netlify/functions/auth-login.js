// netlify/functions/auth-login.js
const crypto = require('crypto');

exports.handler = async (event, context) => {
  const { httpMethod, body } = event;
  const identityURL = process.env.URL + '/.netlify/identity'; // Netlify Identity 端点

  // GET 请求：检查当前登录状态
  if (httpMethod === 'GET') {
    try {
      // 检查是否有有效的 JWT cookie
      const cookies = parseCookies(event.headers.cookie || '');
      const token = cookies.nf_jwt;
      
      if (!token) {
        return { statusCode: 401, body: JSON.stringify({ error: '未登录' }) };
      }
      
      // 验证 token 并获取用户信息
      const userInfo = await verifyToken(token, identityURL);
      
      if (userInfo) {
        return {
          statusCode: 200,
          body: JSON.stringify({ email: userInfo.email })
        };
      } else {
        return { statusCode: 401, body: JSON.stringify({ error: '未登录' }) };
      }
    } catch (error) {
      console.error('Token验证错误:', error);
      return { statusCode: 401, body: JSON.stringify({ error: '未登录' }) };
    }
  }

  // POST 请求：登录
  if (httpMethod === 'POST') {
    try {
      const { email, password } = JSON.parse(body || '{}');
      
      if (!email || !password) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: '邮箱和密码不能为空' })
        };
      }
      
      // 调用 Netlify Identity 登录接口
      const response = await fetch(`${identityURL}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'password',
          username: email,
          password: password
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return {
          statusCode: 401,
          body: JSON.stringify({ 
            error: errorData.error_description || '邮箱或密码错误' 
          })
        };
      }
      
      const data = await response.json();
      
      // 创建安全的 JWT cookie
      const token = data.access_token;
      const cookie = createSecureCookie('nf_jwt', token, 7); // 7天有效期
      
      return {
        statusCode: 200,
        headers: {
          'Set-Cookie': cookie,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        },
        body: JSON.stringify({ 
          email: data.user_email,
          token: token
        })
      };
    } catch (error) {
      console.error('登录错误:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: '登录服务器错误' })
      };
    }
  }

  // DELETE 请求：退出登录
  if (httpMethod === 'DELETE') {
    return {
      statusCode: 200,
      headers: {
        'Set-Cookie': 'nf_jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; HttpOnly; Secure; SameSite=Strict'
      },
      body: JSON.stringify({ message: '已退出登录' })
    };
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};

// 辅助函数：解析 cookie
function parseCookies(cookieHeader) {
  return cookieHeader
    .split(';')
    .reduce((cookies, cookie) => {
      const [name, ...valueParts] = cookie.trim().split('=');
      const value = valueParts.join('=');
      cookies[name] = decodeURIComponent(value);
      return cookies;
    }, {});
}

// 辅助函数：验证 JWT token
async function verifyToken(token, identityURL) {
  try {
    const response = await fetch(`${identityURL}/user`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Token验证失败:', error);
    return null;
  }
}

// 辅助函数：创建安全的 HTTP cookie
function createSecureCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secureFlag = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
  
  return `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; HttpOnly; ${secureFlag}SameSite=Strict`;
}
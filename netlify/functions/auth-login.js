// netlify/functions/auth-login.js
// 移除 crypto 依赖，不需要手动处理 token

exports.handler = async (event, context) => {
  const { httpMethod, body, headers } = event;
  const siteURL = process.env.URL || 'https://aiexplore.netlify.app';
  const identityURL = `${siteURL}/.netlify/identity`;

  // GET 请求：检查当前登录状态
  if (httpMethod === 'GET') {
    try {
      const cookies = parseCookies(headers.cookie || '');
      const token = cookies.nf_jwt;
      
      if (!token) {
        return { statusCode: 401, body: JSON.stringify({ error: '未登录' }) };
      }
      
      // 使用 Netlify 内置的 /user 端点验证 token
      const userInfo = await getUserInfo(token, identityURL);
      
      if (userInfo) {
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            email: userInfo.email,
            isLoggedIn: true 
          })
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
      
      // 调用 Netlify Identity 的内置登录接口
      // 注意：这个接口会自动设置 HttpOnly 的 nf_jwt cookie
      const response = await fetch(`${identityURL}/token`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'password',
          username: email,
          password: password
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('登录失败:', data);
        return {
          statusCode: 401,
          body: JSON.stringify({ 
            error: data.error_description || '邮箱或密码错误' 
          })
        };
      }
      
      // 登录成功！Netlify 会自动设置 nf_jwt cookie
      // 我们只需要返回成功信息
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        },
        body: JSON.stringify({ 
          success: true,
          email: data.user_email || email,
          message: '登录成功'
        })
      };
    } catch (error) {
      console.error('登录错误:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: '登录服务器错误: ' + error.message })
      };
    }
  }

  // DELETE 请求：退出登录
  if (httpMethod === 'DELETE') {
    return {
      statusCode: 200,
      headers: {
        'Set-Cookie': 'nf_jwt=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; HttpOnly; SameSite=Strict'
      },
      body: JSON.stringify({ 
        success: true,
        message: '已退出登录' 
      })
    };
  }

  return { 
    statusCode: 405, 
    body: JSON.stringify({ error: 'Method Not Allowed' }) 
  };
};

// 辅助函数：解析 cookie
function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader
    .split(';')
    .reduce((cookies, cookie) => {
      const [name, ...valueParts] = cookie.trim().split('=');
      const value = valueParts.join('=');
      if (name && value) {
        cookies[name.trim()] = decodeURIComponent(value.trim());
      }
      return cookies;
    }, {});
}

// 辅助函数：获取用户信息
async function getUserInfo(token, identityURL) {
  try {
    const response = await fetch(`${identityURL}/user`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
}
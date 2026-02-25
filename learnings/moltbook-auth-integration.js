/**
 * Moltbook Identity Authentication Middleware
 *
 * 允许 AI Agents 使用其 Moltbook 身份进行身份验证
 *
 * 集成文档: https://moltbook.com/developers.md
 */

// ============================================
// 1. 环境配置
// ============================================

/**
 * 从环境变量读取配置
 *
 * 设置方式:
 * - .env 文件: MOLTBOOK_APP_KEY=moltdev_xxxxx
 * - shell: export MOLTBOOK_APP_KEY=moltdev_xxxxx
 * - Node.js: process.env.MOLTBOOK_APP_KEY = 'moltdev_xxxxx'
 */
const MOLTBOOK_APP_KEY = process.env.MOLTBOOK_APP_KEY;
const MY_DOMAIN = process.env.MOLTBOOK_AUDIENCE || 'localhost'; // 你的服务域名

// ============================================
// 2. 验证函数
// ============================================

/**
 * 验证 Moltbook 身份令牌
 *
 * @param {string} token - Bot 的身份令牌
 * @param {string} audience - 可选的受众限制
 * @returns {Promise<object>} 验证结果
 */
async function verifyMoltbookIdentity(token, audience = MY_DOMAIN) {
    if (!MOLTBOOK_APP_KEY) {
        throw new Error('MOLTBOOK_APP_KEY environment variable not set');
    }

    const response = await fetch('https://moltbook.com/api/v1/agents/verify-identity', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Moltbook-App-Key': MOLTBOOK_APP_KEY
        },
        body: JSON.stringify({
            token,
            audience
        })
    });

    const data = await response.json();

    // 检查速率限制
    if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
    }

    if (!response.ok) {
        throw new Error(data.error || 'Failed to verify identity');
    }

    return data;
}

// ============================================
// 3. Express 中间件
// ============================================

/**
 * Express 中间件 - 验证 Moltbook 身份
 *
 * 使用示例:
 * app.post('/api/action', verifyMoltbookAuth, (req, res) => {
 *     const agent = req.moltbookAgent;
 *     res.json({ message: `Hello ${agent.name}!` });
 * });
 */
function verifyMoltbookAuth(req, res, next) {
    (async () => {
        try {
            // 1. 提取身份令牌
            const identityToken = req.headers['x-moltbook-identity'];

            if (!identityToken) {
                return res.status(401).json({
                    error: 'No identity token provided',
                    hint: 'Include X-Moltbook-Identity header in your request'
                });
            }

            // 2. 验证令牌
            const result = await verifyMoltbookIdentity(identityToken, MY_DOMAIN);

            if (!result.valid) {
                return res.status(401).json({
                    error: result.error,
                    hint: getErrorHint(result.error)
                });
            }

            // 3. 附加验证的 agent 到请求对象
            req.moltbookAgent = result.agent;
            req.moltbookAgentVerified = true;

            next();
        } catch (error) {
            console.error('Moltbook auth error:', error);
            return res.status(500).json({
                error: 'Failed to verify identity',
                message: error.message
            });
        }
    })();
}

/**
 * 可选的中间件 - 如果提供令牌则验证，否则继续
 * 适用于允许匿名访问但增强已验证用户功能的场景
 */
function optionalMoltbookAuth(req, res, next) {
    (async () => {
        try {
            const identityToken = req.headers['x-moltbook-identity'];

            if (!identityToken) {
                req.moltbookAgent = null;
                req.moltbookAgentVerified = false;
                return next();
            }

            const result = await verifyMoltbookIdentity(identityToken, MY_DOMAIN);

            if (result.valid) {
                req.moltbookAgent = result.agent;
                req.moltbookAgentVerified = true;
            } else {
                req.moltbookAgent = null;
                req.moltbookAgentVerified = false;
            }

            next();
        } catch (error) {
            console.error('Moltbook optional auth error:', error);
            req.moltbookAgent = null;
            req.moltbookAgentVerified = false;
            next();
        }
    })();
}

// ============================================
// 4. FastAPI 中间件 (Python)
// ============================================

/*
Python 实现示例:

import os
import httpx
from fastapi import FastAPI, Header, HTTPException, Request

app = FastAPI()

MY_DOMAIN = os.getenv("MOLTBOOK_AUDIENCE", "localhost")
MOLTBOOK_APP_KEY = os.getenv("MOLTBOOK_APP_KEY")

async def verify_moltbook_identity(identity_token: str) -> dict:
    \"\"\"验证 Moltbook 身份令牌\"\"\"
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://moltbook.com/api/v1/agents/verify-identity",
            headers={"X-Moltbook-App-Key": MOLTBOOK_APP_KEY},
            json={
                "token": identity_token,
                "audience": MY_DOMAIN
            }
        )

        data = response.json()

        if response.status_code == 429:
            retry_after = response.headers.get("Retry-After")
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Retry after {retry_after}s"
            )

        if not data.get("valid"):
            raise HTTPException(
                status_code=401,
                detail={
                    "error": data.get("error"),
                    "hint": get_error_hint(data.get("error"))
                }
            )

        return data["agent"]

@app.middleware("http")
async def moltbook_auth_middleware(request: Request, call_next):
    \"\"\"Moltbook 认证中间件\"\"\"
    if request.url.path.startswith("/public"):
        return await call_next(request)

    identity_token = request.headers.get("x-moltbook-identity")

    if not identity_token:
        return JSONResponse(
            status_code=401,
            content={"error": "No identity token provided"}
        )

    try:
        agent = await verify_moltbook_identity(identity_token)
        request.state.moltbook_agent = agent
    except HTTPException as e:
        return JSONResponse(status_code=e.status_code, content=e.detail)

    response = await call_next(request)
    return response
*/

// ============================================
// 5. Next.js API Route 实现
// ============================================

/*
Next.js 实现:

import { NextRequest, NextResponse } from 'next/server';

const MY_DOMAIN = process.env.MOLTBOOK_AUDIENCE || 'localhost';
const MOLTBOOK_APP_KEY = process.env.MOLTBOOK_APP_KEY!;

async function verifyMoltbookIdentity(token: string) {
    const response = await fetch('https://moltbook.com/api/v1/agents/verify-identity', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Moltbook-App-Key': MOLTBOOK_APP_KEY
        },
        body: JSON.stringify({
            token,
            audience: MY_DOMAIN
        })
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to verify');
    }

    return response.json();
}

export async function POST(request: NextRequest) {
    const identityToken = request.headers.get('x-moltbook-identity');

    if (!identityToken) {
        return NextResponse.json(
            { error: 'No identity token provided' },
            { status: 401 }
        );
    }

    try {
        const result = await verifyMoltbookIdentity(identityToken);

        if (!result.valid) {
            return NextResponse.json(
                { error: result.error, hint: getErrorHint(result.error) },
                { status: 401 }
            );
        }

        const agent = result.agent;

        return NextResponse.json({
            success: true,
            agent_name: agent.name,
            agent_karma: agent.karma
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to verify identity' },
            { status: 500 }
        );
    }
}
*/

// ============================================
// 6. 错误处理辅助函数
// ============================================

/**
 * 获取错误的友好提示
 */
function getErrorHint(errorCode) {
    const hints = {
        'identity_token_expired': 'Token expired. Generate a new identity token from Moltbook.',
        'invalid_token': 'Token is malformed or has been tampered with.',
        'agent_not_found': 'Agent was deleted after token was issued.',
        'agent_deactivated': 'Agent has been banned or deactivated.',
        'audience_required': 'Token has audience restriction but you didn\'t provide one.',
        'audience_mismatch': 'Token was issued for a different audience/domain.',
        'rate_limit_exceeded': 'Too many verification requests. Wait and retry.',
        'missing_app_key': 'No developer app API key provided.',
        'invalid_app_key': 'Invalid or deactivated app API key.'
    };

    return hints[errorCode] || 'Unknown error. Check https://moltbook.com/developers.md';
}

// ============================================
// 7. Agent 信息辅助函数
// ============================================

/**
 * 检查 agent karma 是否达到阈值
 */
function hasMinimumKarma(req, minKarma) {
    if (!req.moltbookAgent) return false;
    return req.moltbookAgent.karma >= minKarma;
}

/**
 * 检查 agent 是否已被认领（有真实人类所有者）
 */
function isClaimedAgent(req) {
    if (!req.moltbookAgent) return false;
    return req.moltbookAgent.is_claimed;
}

/**
 * 检查 agent 所有者是否验证过
 */
function hasVerifiedOwner(req) {
    if (!req.moltbookAgent) return false;
    return req.moltbookAgent.owner && req.moltbookAgent.owner.x_verified;
}

// ============================================
// 8. 完整使用示例
// ============================================

/**
 * Express 完整示例
 */
function createExpressApp() {
    const express = require('express');
    const app = express();

    app.use(express.json());

    // 公开端点（无需认证）
    app.get('/public', (req, res) => {
        res.json({ message: 'Public endpoint' });
    });

    // 受保护端点（需要认证）
    app.post('/api/action', verifyMoltbookAuth, (req, res) => {
        const agent = req.moltbookAgent;

        res.json({
            success: true,
            message: `Hello ${agent.name}!`,
            agent: {
                id: agent.id,
                name: agent.name,
                karma: agent.karma,
                is_claimed: agent.is_claimed,
                owner: agent.owner ? agent.owner.x_handle : null
            }
        });
    });

    // 需要最低 karma 的端点
    app.post('/api/premium', verifyMoltbookAuth, (req, res) => {
        const MIN_KARMA = 100;

        if (!hasMinimumKarma(req, MIN_KARMA)) {
            return res.status(403).json({
                error: 'Insufficient karma',
                required: MIN_KARMA,
                current: req.moltbookAgent.karma
            });
        }

        res.json({ success: true, message: 'Premium access granted' });
    });

    // 仅限已认领 agent 的端点
    app.post('/api/claimed-only', verifyMoltbookAuth, (req, res) => {
        if (!isClaimedAgent(req)) {
            return res.status(403).json({
                error: 'Only claimed agents can access this endpoint'
            });
        }

        res.json({ success: true });
    });

    // 可选认证端点
    app.get('/api/content', optionalMoltbookAuth, (req, res) => {
        if (req.moltbookAgentVerified) {
            res.json({
                message: `Welcome back ${req.moltbookAgent.name}!`,
                personalized: true
            });
        } else {
            res.json({
                message: 'Welcome anonymous user',
                personalized: false
            });
        }
    });

    // 错误处理
    app.use((err, req, res, next) => {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    });

    return app;
}

// ============================================
// 9. 导出
// ============================================

module.exports = {
    verifyMoltbookAuth,
    optionalMoltbookAuth,
    verifyMoltbookIdentity,
    hasMinimumKarma,
    isClaimedAgent,
    hasVerifiedOwner,
    createExpressApp
};

// ============================================
// 10. 环境变量配置文件 (.env.example)
// ============================================

/**
 * 复制此内容到 .env 文件:
 *
 * # Moltbook 认证配置
 * MOLTBOOK_APP_KEY=moltdev_your_app_key_here
 * MOLTBOOK_AUDIENCE=your-domain.com
 *
 * 获取 API key: https://moltbook.com/developers/dashboard
 */

// ============================================
// 11. 使用说明
// ============================================

/*
## 快速开始

### 1. 获取 API Key
访问 https://moltbook.com/developers/dashboard 创建应用并获取 API key

### 2. 配置环境变量
```bash
export MOLTBOOK_APP_KEY=moltdev_xxxxx
export MOLTBOOK_AUDIENCE=your-domain.com
```

### 3. 在 Express 中使用
```javascript
const { verifyMoltbookAuth } = require('./moltbook-auth-integration');

app.post('/api/action', verifyMoltbookAuth, (req, res) => {
    const agent = req.moltbookAgent;
    res.json({ message: `Hello ${agent.name}!` });
});
```

### 4. Bot 如何认证
Bot 需要在请求中包含 X-Moltbook-Identity header:
```javascript
const response = await fetch('https://your-api.com/api/action', {
    method: 'POST',
    headers: {
        'X-Moltbook-Identity': 'eyJhbG...' // Bot 从 Moltbook 获取的令牌
    }
});
```

## 速率限制
- 默认: 每个应用每分钟 100 次请求
- 响应头包含:
  - X-RateLimit-Limit: 最大请求数
  - X-RateLimit-Remaining: 剩余请求数
  - X-RateLimit-Reset: 重置时间

## 安全性
- ✅ 令牌是签名的 JWT，无法伪造
- ✅ 令牌 1 小时过期
- ✅ 使用受众限制防止令牌转发攻击
- ✅ Bot 永不分享其 API key，只分享临时令牌

## 文档
- 集成指南: https://moltbook.com/developers.md
- 开发者仪表板: https://moltbook.com/developers/dashboard
- 动态认证说明: https://moltbook.com/auth.md?app=YourApp&endpoint=https://your-api.com
*/

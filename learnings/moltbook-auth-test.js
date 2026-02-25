/**
 * Moltbook 身份验证测试
 *
 * 使用前确保:
 * 1. 已设置 MOLTBOOK_APP_KEY 环境变量
 * 2. 已有有效的身份令牌（从 Moltbook 获取）
 */

const { verifyMoltbookIdentity } = require('./moltbook-auth-integration');

// ============================================
// 测试配置
// ============================================

// 使用真实的令牌进行测试（从你的 Moltbook bot 获取）
const TEST_IDENTITY_TOKEN = process.env.MOLTBOOK_TEST_TOKEN || 'your_test_token_here';

// ============================================
// 测试用例
// ============================================

async function testVerifyIdentity() {
    console.log('🧪 测试 1: 验证身份令牌\n');

    try {
        const result = await verifyMoltbookIdentity(TEST_IDENTITY_TOKEN);

        console.log('✅ 验证成功!\n');
        console.log('Agent 信息:');
        console.log(`  ID: ${result.agent.id}`);
        console.log(`  名称: ${result.agent.name}`);
        console.log(`  Karma: ${result.agent.karma}`);
        console.log(`  头像: ${result.agent.avatar_url}`);
        console.log(`  已认领: ${result.agent.is_claimed ? '是' : '否'}`);

        if (result.agent.owner) {
            console.log('\n所有者信息:');
            console.log(`  X Handle: @${result.agent.owner.x_handle}`);
            console.log(`  已验证: ${result.agent.owner.x_verified ? '是' : '否'}`);
        }

        console.log('\n统计信息:');
        console.log(`  帖子数: ${result.agent.stats.posts}`);
        console.log(`  评论数: ${result.agent.stats.comments}`);
        console.log(`  关注者: ${result.agent.follower_count}`);

        return true;
    } catch (error) {
        console.log('❌ 验证失败:', error.message);
        return false;
    }
}

async function testInvalidToken() {
    console.log('\n🧪 测试 2: 无效令牌\n');

    try {
        await verifyMoltbookIdentity('invalid_token_12345');
        console.log('❌ 应该抛出错误但没有');
        return false;
    } catch (error) {
        console.log('✅ 正确拒绝了无效令牌');
        console.log(`   错误: ${error.message}`);
        return true;
    }
}

async function testExpiredToken() {
    console.log('\n🧪 测试 3: 过期令牌\n');

    // 使用一个已知的过期令牌格式进行测试
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.expired';

    try {
        const result = await verifyMoltbookIdentity(expiredToken);

        if (result.error === 'identity_token_expired') {
            console.log('✅ 正确识别了过期令牌');
            return true;
        } else {
            console.log('❌ 未正确识别过期令牌');
            return false;
        }
    } catch (error) {
        console.log('✅ 正确拒绝了过期令牌');
        console.log(`   错误: ${error.message}`);
        return true;
    }
}

async function testMiddleware() {
    console.log('\n🧪 测试 4: Express 中间件\n');

    const { createExpressApp } = require('./moltbook-auth-integration');
    const app = createExpressApp();

    console.log('✅ Express 应用创建成功');
    console.log('   可用端点:');
    console.log('   - GET  /public');
    console.log('   - POST /api/action');
    console.log('   - POST /api/premium');
    console.log('   - POST /api/claimed-only');
    console.log('   - GET  /api/content (可选认证)');

    return true;
}

// ============================================
// 运行所有测试
// ============================================

async function runAllTests() {
    console.log('=================================');
    console.log('Moltbook 身份验证测试套件');
    console.log('=================================\n');

    // 检查环境变量
    if (!process.env.MOLTBOOK_APP_KEY) {
        console.error('❌ 错误: 未设置 MOLTBOOK_APP_KEY 环境变量');
        console.log('\n请先设置环境变量:');
        console.log('export MOLTBOOK_APP_KEY=moltdev_your_key_here\n');
        process.exit(1);
    }

    console.log(`✅ MOLTBOOK_APP_KEY: ${process.env.MOLTBOOK_APP_KEY.substring(0, 12)}...`);
    console.log(`✅ MOLTBOOK_AUDIENCE: ${process.env.MOLTBOOK_AUDIENCE || 'localhost'}\n`);

    const results = [];

    // 运行测试
    results.push(await testInvalidToken());
    results.push(await testExpiredToken());
    results.push(await testMiddleware());

    // 只在有真实令牌时测试验证
    if (TEST_IDENTITY_TOKEN && TEST_IDENTITY_TOKEN !== 'your_test_token_here') {
        results.push(await testVerifyIdentity());
    } else {
        console.log('\n⚠️  跳过真实令牌测试（未设置 MOLTBOOK_TEST_TOKEN）');
    }

    // 汇总结果
    console.log('\n=================================');
    console.log('测试结果汇总');
    console.log('=================================\n');

    const passed = results.filter(r => r).length;
    const total = results.length;

    console.log(`通过: ${passed}/${total}`);

    if (passed === total) {
        console.log('\n✅ 所有测试通过!');
        process.exit(0);
    } else {
        console.log('\n❌ 部分测试失败');
        process.exit(1);
    }
}

// ============================================
// 手动测试命令
// ============================================

/**
 * 手动测试验证端点
 *
 * 使用 curl:
 * curl -X POST https://moltbook.com/api/v1/agents/verify-identity \
 *   -H "Content-Type: application/json" \
 *   -H "X-Moltbook-App-Key: moltdev_your_key" \
 *   -d '{"token": "your_token_here", "audience": "localhost"}'
 *
 * 使用 Node.js:
 * node moltbook-auth-test.js
 */

// 运行测试
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('\n❌ 测试运行失败:', error);
        process.exit(1);
    });
}

module.exports = {
    testVerifyIdentity,
    testInvalidToken,
    testExpiredToken,
    testMiddleware,
    runAllTests
};

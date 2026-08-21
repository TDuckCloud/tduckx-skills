#!/usr/bin/env node

/**
 * ==============================================================================
 * TDuck（填鸭表单）MCP Skill 安装辅助脚本 (Node.js 原生版)
 * 
 * 这是一个标准 MCP 类型的 Skill —— 实际能力由 TDuck MCP Server 提供，
 * 纯原生 Node.js 实现，无需安装任何额外依赖。
 * 
 * 脚本作用：
 * 1. 把 appId / appSecret 编码成 HTTP Basic 认证凭证
 * 2. 打印 / 生成针对 Cursor、Claude Desktop、Trae 等客户端的 MCP 配置片段
 * 3. 协助进行快速接入与配置
 * 
 * 用法：
 *   node setup.js                               # 打印配置与接入说明
 *   node setup.js --encode APP_ID APP_SECRET    # 把 appId/appSecret 编成 Basic 凭证
 *   node setup.js --print-json APP_ID APP_SECRET # 输出含 Authorization 头的 mcp.json
 *   node setup.js --server-url https://x.tduckcloud.com/tduck-api/mcp # 自定义服务端地址
 * ==============================================================================
 */

const DEFAULT_MCP_NAME = 'tduck';
const DEFAULT_MCP_URL = 'https://x.tduckcloud.com/tduck-api/mcp';

/**
 * 把 appId + appSecret 拼成 appId:appSecret 并 Base64 编码
 */
function encodeBasic(appId, appSecret) {
  const raw = `${appId}:${appSecret}`;
  return Buffer.from(raw, 'utf-8').toString('base64');
}

/**
 * 构建 MCP 配置 JSON 对象
 */
function buildSnippet(serverUrl = DEFAULT_MCP_URL, credentials = null) {
  const config = {
    url: serverUrl
  };
  if (credentials) {
    config.headers = {
      Authorization: `Basic ${credentials}`
    };
  }
  return {
    mcpServers: {
      [DEFAULT_MCP_NAME]: config
    }
  };
}

function printBanner() {
  console.log('='.repeat(60));
  console.log('  TDuck（填鸭表单）MCP Skill · 安装配置辅助 (Node.js 原生版)');
  console.log('='.repeat(60));
}

function printSetupInstructions(serverUrl = DEFAULT_MCP_URL) {
  printBanner();
  console.log();
  console.log(`默认 MCP 地址：${serverUrl}`);
  console.log();
  console.log('TDuck MCP 支持两种主流接入方式：');
  console.log();
  console.log('─'.repeat(60));
  console.log(' 方式 A · OAuth 2.0 自动授权（推荐）');
  console.log('─'.repeat(60));
  console.log();
  console.log('  1. 在 Cursor / Claude Desktop / Windsurf 的 MCP 配置中填入：');
  console.log();
  console.log(JSON.stringify(buildSnippet(serverUrl), null, 2));
  console.log();
  console.log('  2. AI 客户端会自动弹出浏览器打开 TDuck 登录授权页，点击确认授权即可完成一键绑定！');
  console.log();
  console.log('─'.repeat(60));
  console.log(' 方式 B · HTTP Basic Auth (appId:appSecret)');
  console.log('─'.repeat(60));
  console.log();
  console.log('  1. 登录 TDuck 管理后台获取 OpenAPI 开发者密钥（appId / appSecret）。');
  console.log('  2. 运行 `node setup.js --print-json YOUR_APP_ID YOUR_APP_SECRET` 获取配置 JSON。');
  console.log('  3. 粘贴到 AI 客户端的 mcp.json 文件中。');
  console.log();
  console.log('─'.repeat(60));
  console.log();
  console.log("配置完成后，在对话中发送 '查一下我在 TDuck 里的表单' 即可验证连接！");
  console.log();
}

function main() {
  const args = process.argv.slice(2);
  let serverUrl = DEFAULT_MCP_URL;
  let encodeArgs = null;
  let printJsonArgs = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--server-url' && i + 1 < args.length) {
      serverUrl = args[++i];
    } else if (arg.startsWith('--server-url=')) {
      serverUrl = arg.slice(13);
    } else if (arg === '--encode' && i + 2 < args.length) {
      encodeArgs = [args[i + 1], args[i + 2]];
      i += 2;
    } else if (arg === '--print-json' && i + 2 < args.length) {
      printJsonArgs = [args[i + 1], args[i + 2]];
      i += 2;
    } else if (arg === '-h' || arg === '--help') {
      console.log(`
TDuck（填鸭表单）MCP Skill 安装辅助脚本 (Node.js 原生版)

用法:
  node setup.js [选项]

选项:
  --server-url <url>                TDuck MCP Server 地址 (默认: ${DEFAULT_MCP_URL})
  --encode <appId> <appSecret>      把 appId 与 appSecret 编码为 Basic 凭据
  --print-json <appId> <appSecret>  输出适用于 Claude Desktop / Cursor 的完整 mcp.json 片段
  -h, --help                        显示帮助信息

示例:
  node setup.js
  node setup.js --encode myAppId mySecret
  node setup.js --print-json myAppId mySecret --server-url https://x.tduckcloud.com/tduck-api/mcp
`);
      process.exit(0);
    }
  }

  if (encodeArgs) {
    const cred = encodeBasic(encodeArgs[0], encodeArgs[1]);
    console.log(cred);
    return;
  }

  if (printJsonArgs) {
    const cred = encodeBasic(printJsonArgs[0], printJsonArgs[1]);
    console.log(JSON.stringify(buildSnippet(serverUrl, cred), null, 2));
    return;
  }

  printSetupInstructions(serverUrl);
}

main();

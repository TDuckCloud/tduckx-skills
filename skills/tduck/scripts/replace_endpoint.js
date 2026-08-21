#!/usr/bin/env node

/**
 * ==============================================================================
 * TDuck Skill 服务端点一键批量替换脚本 (Node.js 原生版)
 * 
 * 纯原生 Node.js 实现，零外部依赖，跨平台兼容 macOS、Linux 与 Windows。
 * 用于将本 Skill 仓库中所有文件内的 TDuck 服务地址 / MCP 端点批量替换为您自己的实际部署地址。
 *
 * 用法示例：
 *   1. 命令行直接指定新地址：
 *      node replace_endpoint.js https://x.tduckcloud.com/tduck-api
 *    
 *
 *   2. 带参数指定：
 *      node replace_endpoint.js --url https://x.tduckcloud.com/tduck-api
 *
 *   3. 预览模式（仅检查匹配文件，不实际写入）：
 *      node replace_endpoint.js --url https://x.tduckcloud.com/tduck-api --dry-run
 *
 *   4. 交互式运行：
 *      node replace_endpoint.js
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 需扫描的文件后缀
const TARGET_EXTENSIONS = new Set([
  '.md', '.json', '.py', '.sh', '.js', '.ts', '.yml', '.yaml', '.txt', '.svg'
]);

// 需忽略的目录
const IGNORE_DIRS = new Set([
  '.git', '.idea', '.vscode', 'node_modules', 'target', 'dist', 'build', '__pycache__', '.gemini'
]);

// 排除自身脚本文件名
const IGNORE_FILES = new Set([
  'replace_endpoint.js',
  'replace_endpoint.sh',
  'replace_endpoint.py'
]);

// 常见的预置旧服务端点地址
const KNOWN_DEFAULT_MCP_URLS = [
  'https://dev.tduckcloud.com/tduck-api/mcp',
  'http://localhost:8996/tduck-api/mcp'
];

/**
 * 规范化输入的 URL，拆解出 base_url 与 mcp_url
 */
function normalizeUrls(inputUrl) {
  if (!inputUrl) return { baseUrl: '', mcpUrl: '' };
  let cleaned = inputUrl.trim().replace(/\/+$/, '');
  let baseUrl = '';
  let mcpUrl = '';

  if (cleaned.endsWith('/mcp')) {
    mcpUrl = cleaned;
    baseUrl = cleaned.slice(0, -4);
  } else {
    baseUrl = cleaned;
    mcpUrl = `${cleaned}/mcp`;
  }
  return { baseUrl, mcpUrl };
}

/**
 * 向上自动定位最顶层 tduckx-skills 仓库根目录
 */
function findRepoRoot() {
  let current = path.resolve(__dirname);
  let topRoot = current;

  while (current !== path.dirname(current)) {
    const hasGit = fs.existsSync(path.join(current, '.git'));
    const hasSkillsAndReadme = fs.existsSync(path.join(current, 'skills')) && fs.existsSync(path.join(current, 'README.md'));
    const hasSkillMd = fs.existsSync(path.join(current, 'SKILL.md'));

    if (hasGit || hasSkillsAndReadme || (hasSkillMd && fs.existsSync(path.join(current, 'skills')))) {
      topRoot = current;
    }
    current = path.dirname(current);
  }
  return topRoot;
}

/**
 * 从现有配置文件和内容中收集已存在的所有旧 MCP 地址
 */
function collectOldUrls(rootDir) {
  const urlSet = new Set(KNOWN_DEFAULT_MCP_URLS);

  const candidateFiles = [
    path.join(rootDir, 'trae/tduck/.mcp.json'),
    path.join(rootDir, 'workbuddy/connector/tduck/mcp.json'),
    path.join(rootDir, '.cursor/mcp.json'),
    path.join(rootDir, 'skills/tduck/SKILL.md'),
    path.join(rootDir, 'SKILL.md'),
    path.join(rootDir, 'README.md')
  ];

  for (const filePath of candidateFiles) {
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const matches = content.matchAll(/https?:\/\/[^\s"'`)]+\/tduck-api(\/mcp)?/g);
        for (const m of matches) {
          const matchedUrl = m[0];
          const normalized = normalizeUrls(matchedUrl);
          if (normalized.mcpUrl) {
            urlSet.add(normalized.mcpUrl);
          }
        }
      } catch {
        // 忽略读取错误
      }
    }
  }

  return Array.from(urlSet);
}

/**
 * 递归收集所有目标文件
 */
function collectFiles(dir, fileList = []) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return fileList;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        collectFiles(fullPath, fileList);
      }
    } else if (entry.isFile()) {
      if (IGNORE_FILES.has(entry.name)) {
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (TARGET_EXTENSIONS.has(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

/**
 * 对单文件执行替换
 */
function replaceInFile(filePath, pairs, dryRun = false) {
  let content = '';
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return 0;
  }

  let totalMatches = 0;
  let newContent = content;

  for (const [oldStr, newStr] of pairs) {
    if (!oldStr || oldStr === newStr) continue;
    if (newContent.includes(oldStr)) {
      const parts = newContent.split(oldStr);
      const count = parts.length - 1;
      totalMatches += count;
      newContent = parts.join(newStr);
    }
  }

  if (totalMatches > 0 && !dryRun) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
  }

  return totalMatches;
}

/**
 * 执行批量替换流程
 */
function runBatchReplace({ newUrlInput, customRootDir, dryRun = false }) {
  const rootDir = customRootDir ? path.resolve(customRootDir) : findRepoRoot();
  const newUrls = normalizeUrls(newUrlInput);
  const oldMcpUrls = collectOldUrls(rootDir);

  console.log('='.repeat(65));
  console.log('  TDuck Skill 服务端点批量替换工具 (Node.js 原生版)');
  console.log('='.repeat(65));
  console.log(`目标根目录 : ${rootDir}`);
  console.log(`运行模式   : ${dryRun ? '[DRY RUN 预览模式]' : '[写入模式]'}`);
  console.log('─'.repeat(65));
  console.log(`更新目标 MCP : ${newUrls.mcpUrl}`);
  console.log(`更新目标 Base: ${newUrls.baseUrl}`);
  console.log('─'.repeat(65));

  // 构建替换对：先替换具体的 /mcp 地址，再替换 Base 地址
  const replacePairs = [];
  for (const oldMcp of oldMcpUrls) {
    const oldNorm = normalizeUrls(oldMcp);
    if (oldNorm.mcpUrl && oldNorm.mcpUrl !== newUrls.mcpUrl) {
      replacePairs.push([oldNorm.mcpUrl, newUrls.mcpUrl]);
    }
    if (oldNorm.baseUrl && oldNorm.baseUrl !== newUrls.baseUrl) {
      replacePairs.push([oldNorm.baseUrl, newUrls.baseUrl]);
    }
  }

  // 去重并按长度降序排列（确保先匹配长字符串）
  const uniquePairs = [];
  const seenOld = new Set();
  replacePairs.sort((a, b) => b[0].length - a[0].length);
  for (const [oldStr, newStr] of replacePairs) {
    if (!seenOld.has(oldStr)) {
      seenOld.add(oldStr);
      uniquePairs.push([oldStr, newStr]);
    }
  }

  if (uniquePairs.length === 0) {
    console.log('提示: 当前仓库中所有配置地址与目标新地址一致，无需替换。');
    console.log('='.repeat(65));
    return;
  }

  const files = collectFiles(rootDir);
  let totalFilesChanged = 0;
  let totalReplacements = 0;

  for (const filePath of files) {
    const count = replaceInFile(filePath, uniquePairs, dryRun);
    if (count > 0) {
      const relPath = path.relative(rootDir, filePath);
      console.log(` ✓ [${count} 处] ${relPath}`);
      totalFilesChanged += 1;
      totalReplacements += count;
    }
  }

  console.log('─'.repeat(65));
  if (dryRun) {
    console.log(`预览完成！共发现 ${totalFilesChanged} 个文件待更新，合计 ${totalReplacements} 处地址。`);
    console.log('移除 --dry-run 参数后即可实际应用修改。');
  } else {
    console.log(`替换成功！已完成 ${totalFilesChanged} 个文件的更新，共替换 ${totalReplacements} 处端点地址。`);
  }
  console.log('='.repeat(65));
}

/**
 * 命令行参数解析与交互入口
 */
async function main() {
  const args = process.argv.slice(2);
  let newUrl = null;
  let dryRun = false;
  let customRootDir = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--url' && i + 1 < args.length) {
      newUrl = args[++i];
    } else if (arg.startsWith('--url=')) {
      newUrl = arg.slice(6);
    } else if (arg === '--dir' && i + 1 < args.length) {
      customRootDir = args[++i];
    } else if (arg.startsWith('--dir=')) {
      customRootDir = arg.slice(6);
    } else if (arg === '-h' || arg === '--help') {
      console.log(`
TDuck Skill 服务端点批量替换工具 (Node.js 原生版)

用法:
  node replace_endpoint.js [URL] [选项]

选项:
  --url <url>      新的 TDuck 服务地址（如 https://form.example.com/tduck-api）
  --dry-run        预览模式，只查看将要修改的文件，不实际写入
  --dir <path>     指定目标根目录（默认自动查找仓库根目录）
  -h, --help       显示帮助信息

示例:
  node replace_endpoint.js https://form.example.com/tduck-api
  node replace_endpoint.js --url https://form.example.com/tduck-api --dry-run
`);
      process.exit(0);
    } else if (!arg.startsWith('-') && !newUrl) {
      newUrl = arg;
    }
  }

  if (!newUrl) {
    const rootDir = customRootDir ? path.resolve(customRootDir) : findRepoRoot();
    const oldMcpUrls = collectOldUrls(rootDir);

    console.log('='.repeat(65));
    console.log('  TDuck Skill 服务端点批量替换工具 (Node.js 原生版)');
    console.log('='.repeat(65));
    console.log(`当前检测到的旧端点地址:\n  ${oldMcpUrls.join('\n  ')}\n`);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (query) => new Promise((resolve) => rl.question(query, resolve));
    try {
      const input = await question('请输入新的 TDuck 服务地址 (如 https://form.example.com/tduck-api): ');
      newUrl = input.trim();
    } finally {
      rl.close();
    }
  }

  if (!newUrl) {
    console.error('错误: 未输入有效的新地址！');
    process.exit(1);
  }

  runBatchReplace({ newUrlInput: newUrl, customRootDir, dryRun });
}

main().catch((err) => {
  console.error('执行失败:', err);
  process.exit(1);
});

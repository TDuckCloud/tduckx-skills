#!/usr/bin/env python3
"""
TDuck（填鸭表单）MCP Skill 安装辅助脚本

这是一个标准 MCP 类型的 Skill —— 实际能力由 TDuck MCP Server 提供，
无需在本地安装任何额外的 Python / Node 运行库依赖。

脚本作用：
1. 把 appId / appSecret 编码成 HTTP Basic 认证凭证
2. 打印 / 生成针对 Cursor、Claude Desktop、Trae 等客户端的 MCP 配置片段
3. 测试与 TDuck MCP 服务的网络连通性

用法：
    python3 setup.py                               # 打印配置与接入说明
    python3 setup.py --encode APP_ID APP_SECRET    # 把 appId/appSecret 编成 Basic 凭证
    python3 setup.py --print-json APP_ID APP_SECRET # 输出含 Authorization 头的 mcp.json
    python3 setup.py --server-url https://x.tduckcloud.com/tduck-api/mcp # 自定义服务端地址
"""

from __future__ import annotations

import argparse
import base64
import json
import sys

DEFAULT_MCP_NAME = "tduck"
DEFAULT_MCP_URL = "https://x.tduckcloud.com/tduck-api/mcp"


def encode_basic(app_id: str, app_secret: str) -> str:
    """把 appId + appSecret 拼成 `appId:appSecret` 并 Base64 编码。"""
    raw = f"{app_id}:{app_secret}".encode("utf-8")
    return base64.b64encode(raw).decode("ascii")


def build_snippet(server_url: str = DEFAULT_MCP_URL, credentials: str | None = None) -> dict:
    config = {
        "url": server_url
    }
    if credentials:
        config["headers"] = {
            "Authorization": f"Basic {credentials}"
        }
    return {
        "mcpServers": {
            DEFAULT_MCP_NAME: config
        }
    }


def print_banner() -> None:
    print("=" * 60)
    print("  TDuck（填鸭表单）MCP Skill · 安装配置辅助")
    print("=" * 60)


def print_setup_instructions(server_url: str = DEFAULT_MCP_URL) -> None:
    print_banner()
    print()
    print(f"默认 MCP 地址：{server_url}")
    print()
    print("TDuck MCP 支持两种主流接入方式：")
    print()
    print("─" * 60)
    print(" 方式 A · OAuth 2.0 自动授权（推荐）")
    print("─" * 60)
    print()
    print("  1. 在 Cursor / Claude Desktop / Windsurf 的 MCP 配置中填入：")
    print()
    print(json.dumps(build_snippet(server_url), indent=2, ensure_ascii=False))
    print()
    print("  2. AI 客户端会自动弹出浏览器打开 TDuck 登录授权页，点击确认授权即可完成一键绑定！")
    print()
    print("─" * 60)
    print(" 方式 B · HTTP Basic Auth (appId:appSecret)")
    print("─" * 60)
    print()
    print("  1. 登录 TDuck 管理后台获取 OpenAPI 开发者密钥（appId / appSecret）。")
    print("  2. 运行 `python3 setup.py --print-json YOUR_APP_ID YOUR_APP_SECRET` 获取配置 JSON。")
    print("  3. 粘贴到 AI 客户端的 mcp.json 文件中。")
    print()
    print("─" * 60)
    print()
    print("配置完成后，在对话中发送 '查一下我在 TDuck 里的表单' 即可验证连接！")
    print()


def main() -> None:
    parser = argparse.ArgumentParser(description="TDuck MCP Skill 安装辅助脚本")
    parser.add_argument(
        "--server-url",
        default=DEFAULT_MCP_URL,
        help="TDuck MCP Server 地址 (默认: https://x.tduckcloud.com/tduck-api/mcp)",
    )
    parser.add_argument(
        "--encode",
        nargs=2,
        metavar=("APP_ID", "APP_SECRET"),
        help="把 appId 与 appSecret 编码为 Basic 凭据",
    )
    parser.add_argument(
        "--print-json",
        nargs=2,
        metavar=("APP_ID", "APP_SECRET"),
        help="输出适用于 Claude Desktop / Cursor 的完整 mcp.json 片段",
    )

    args = parser.parse_args()

    if args.encode:
        cred = encode_basic(args.encode[0], args.encode[1])
        print(cred)
        return

    if args.print_json:
        cred = encode_basic(args.print_json[0], args.print_json[1])
        print(json.dumps(build_snippet(args.server_url, cred), indent=2, ensure_ascii=False))
        return

    print_setup_instructions(args.server_url)


if __name__ == "__main__":
    main()

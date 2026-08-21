#!/usr/bin/env python3
"""
TDuck Skill 服务端点一键批量替换脚本

用于将本 Skill 仓库中所有文件内的 TDuck 服务地址 / MCP 端点批量替换为您自己的实际部署地址。

默认原地址：
    MCP 端点: http://localhost:8996/tduck-api/mcp
    API 根路径: http://localhost:8996/tduck-api

用法示例：
    # 1. 命令行直接指定新 MCP 地址：
    python3 replace_endpoint.py https://form.example.com/tduck-api/mcp

    # 2. 指定参数：
    python3 replace_endpoint.py --url https://form.example.com/tduck-api/mcp

    # 3. 试运行模式（仅查看将要修改的文件，不实际写入）：
    python3 replace_endpoint.py --url https://form.example.com/tduck-api/mcp --dry-run

    # 4. 交互式运行：
    python3 replace_endpoint.py
"""

from __future__ import annotations

import argparse
import os
import sys

# 默认扫描的文件后缀
TARGET_EXTENSIONS = {".md", ".json", ".py", ".yml", ".yaml", ".txt", ".svg"}

# 需忽略的目录
IGNORE_DIRS = {".git", ".idea", ".vscode", "__pycache__", "node_modules", "target"}

# 默认原始地址
OLD_MCP_URL = "http://localhost:8996/tduck-api/mcp"
OLD_BASE_URL = "http://localhost:8996/tduck-api"


def normalize_urls(input_url: str) -> tuple[str, str]:
    """根据输入的 URL 规范化出 base_url 与 mcp_url。"""
    cleaned = input_url.strip().rstrip("/")
    if cleaned.endswith("/mcp"):
        mcp_url = cleaned
        base_url = cleaned[:-4]
    else:
        base_url = cleaned
        mcp_url = f"{cleaned}/mcp"
    return base_url, mcp_url


def find_repo_root() -> str:
    """自动定位 tduckx-skill 根目录。"""
    current = os.path.abspath(os.path.dirname(__file__))
    while current != os.path.dirname(current):
        if os.path.exists(os.path.join(current, "SKILL.md")) and (
            os.path.exists(os.path.join(current, "skills")) or os.path.exists(os.path.join(current, "trae"))
        ):
            return current
        current = os.path.dirname(current)
    # 如果找不到则以当前脚本所在目录为准
    return os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def replace_in_file(file_path: str, old_new_pairs: list[tuple[str, str]], dry_run: bool = False) -> int:
    """在指定文件中执行字符串替换。"""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except (UnicodeDecodeError, IOError):
        return 0

    original_content = content
    total_matches = 0

    for old_str, new_str in old_new_pairs:
        if old_str in content:
            matches = content.count(old_str)
            total_matches += matches
            content = content.replace(old_str, new_str)

    if total_matches > 0 and not dry_run:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)

    return total_matches


def run_batch_replace(new_url_input: str, root_dir: str | None = None, dry_run: bool = False) -> None:
    if not root_dir:
        root_dir = find_repo_root()

    new_base_url, new_mcp_url = normalize_urls(new_url_input)

    print("=" * 65)
    print("  TDuck Skill 服务端点批量替换工具")
    print("=" * 65)
    print(f"目标根目录 : {root_dir}")
    print(f"模式       : {'[DRY RUN 预览模式]' if dry_run else '[写入模式]'}")
    print("─" * 65)
    print(f"旧 MCP 地址 : {OLD_MCP_URL}  -->  {new_mcp_url}")
    print(f"旧 Base 地址: {OLD_BASE_URL}  -->  {new_base_url}")
    print("─" * 65)

    # 替换顺序：先替换更长更精确的 /mcp，再替换 base_url
    pairs = [
        (OLD_MCP_URL, new_mcp_url),
        (OLD_BASE_URL, new_base_url),
    ]

    total_files_changed = 0
    total_replacements = 0

    for root, dirs, files in os.walk(root_dir):
        # 过滤忽略目录
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for file in files:
            # 排除替换脚本自身，避免破坏脚本内的默认常量
            if file == "replace_endpoint.py":
                continue

            ext = os.path.splitext(file)[1].lower()
            if ext in TARGET_EXTENSIONS:
                file_path = os.path.join(root, file)
                count = replace_in_file(file_path, pairs, dry_run=dry_run)
                if count > 0:
                    rel_path = os.path.relpath(file_path, root_dir)
                    print(f" ✓ [{count} 处] {rel_path}")
                    total_files_changed += 1
                    total_replacements += count

    print("─" * 65)
    if dry_run:
        print(f"预览完成！共发现 {total_files_changed} 个文件需要修改，合计 {total_replacements} 处地址。")
        print("去掉 --dry-run 参数即可立即应用修改。")
    else:
        print(f"替换成功！已成功修改 {total_files_changed} 个文件，共完成 {total_replacements} 处地址替换。")
    print("=" * 65)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="一键批量替换 TDuck Skill 中的 MCP / 服务地址"
    )
    parser.add_argument(
        "url",
        nargs="?",
        default=None,
        help="新的 TDuck 服务地址（如 https://form.example.com/tduck-api/mcp 或 https://form.example.com/tduck-api）",
    )
    parser.add_argument(
        "--url",
        dest="flag_url",
        help="新的 TDuck 服务地址",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="预览模式，仅打印匹配的文件而不实际修改",
    )
    parser.add_argument(
        "--dir",
        dest="target_dir",
        default=None,
        help="指定执行替换的目标目录（默认自动查找 tduckx-skill 根目录）",
    )

    args = parser.parse_args()
    target_url = args.flag_url or args.url

    if not target_url:
        print("=" * 65)
        print("  TDuck Skill 服务端点批量替换工具")
        print("=" * 65)
        print(f"当前默认 MCP 地址: {OLD_MCP_URL}")
        print()
        try:
            target_url = input("请输入您的新 TDuck 服务地址 (如 https://form.example.com/tduck-api): ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n已取消操作。")
            sys.exit(0)

    if not target_url:
        print("错误: 未提供有效的新地址！")
        sys.exit(1)

    run_batch_replace(target_url, root_dir=args.target_dir, dry_run=args.dry_run)


if __name__ == "__main__":
    main()

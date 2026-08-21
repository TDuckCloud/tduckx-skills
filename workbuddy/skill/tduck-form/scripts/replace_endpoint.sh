#!/usr/bin/env bash
# ==============================================================================
# TDuck Skill 服务端点一键批量替换 Shell 脚本
# 纯原生 Shell 实现，无需 Python 等任何额外环境，兼容 macOS (BSD) 与 Linux (GNU)
# ==============================================================================

set -e

# 定位脚本所在目录与仓库根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/SKILL.md" ]; then
    ROOT_DIR="${SCRIPT_DIR}"
elif [ -f "${SCRIPT_DIR}/../SKILL.md" ]; then
    ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
elif [ -f "${SCRIPT_DIR}/../../SKILL.md" ]; then
    ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
elif [ -f "${SCRIPT_DIR}/../../../SKILL.md" ]; then
    ROOT_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
else
    ROOT_DIR="${SCRIPT_DIR}"
fi

# 1. 自动从现有配置文件中探测当前的 MCP 地址
DETECTED_MCP_URL=""
if [ -f "${ROOT_DIR}/trae/tduck/.mcp.json" ]; then
    DETECTED_MCP_URL="$(grep -o '"url":[[:space:]]*"[^"]*"' "${ROOT_DIR}/trae/tduck/.mcp.json" | head -n1 | sed 's/"url":[[:space:]]*"//;s/"$//')"
fi
if [ -z "${DETECTED_MCP_URL}" ] && [ -f "${ROOT_DIR}/workbuddy/connector/tduck/mcp.json" ]; then
    DETECTED_MCP_URL="$(grep -o '"url":[[:space:]]*"[^"]*"' "${ROOT_DIR}/workbuddy/connector/tduck/mcp.json" | head -n1 | sed 's/"url":[[:space:]]*"//;s/"$//')"
fi
if [ -z "${DETECTED_MCP_URL}" ]; then
    DETECTED_MCP_URL="http://localhost:8996/tduck-api/mcp"
fi

OLD_MCP_URL="${DETECTED_MCP_URL}"
if [[ "${OLD_MCP_URL}" == */mcp ]]; then
    OLD_BASE_URL="${OLD_MCP_URL%/mcp}"
else
    OLD_BASE_URL="${OLD_MCP_URL}"
    OLD_MCP_URL="${OLD_BASE_URL}/mcp"
fi

NEW_INPUT="$1"

echo "================================================================="
echo "  TDuck Skill 服务端点批量替换工具 (Shell 纯原生版)"
echo "================================================================="

if [ -z "${NEW_INPUT}" ]; then
    echo "当前检测到的 MCP 地址: ${OLD_MCP_URL}"
    echo ""
    read -r -p "请输入新的 TDuck 服务地址 (如 https://form.example.com/tduck-api): " NEW_INPUT
fi

# 去除尾部斜杠和空格
NEW_INPUT="$(echo "${NEW_INPUT}" | sed 's/[[:space:]]*$//' | sed 's#/*$##')"

if [ -z "${NEW_INPUT}" ]; then
    echo "错误: 未输入有效的新地址！"
    exit 1
fi

# 智能解析 new_base_url 与 new_mcp_url
if [[ "${NEW_INPUT}" == */mcp ]]; then
    NEW_MCP_URL="${NEW_INPUT}"
    NEW_BASE_URL="${NEW_INPUT%/mcp}"
else
    NEW_BASE_URL="${NEW_INPUT}"
    NEW_MCP_URL="${NEW_INPUT}/mcp"
fi

echo "目标根目录 : ${ROOT_DIR}"
echo "-----------------------------------------------------------------"
echo "当前旧地址 : ${OLD_MCP_URL}"
echo "更新目标   : ${NEW_MCP_URL}"
echo "-----------------------------------------------------------------"

if [ "${OLD_MCP_URL}" = "${NEW_MCP_URL}" ]; then
    echo "提示: 当前地址与目标新地址一致，无需替换。"
    exit 0
fi

# 检测操作系统类型以适配 sed
IS_MAC=false
if [[ "$OSTYPE" == "darwin"* ]]; then
    IS_MAC=true
fi

# 转义用于 sed 的分隔符特殊字符
escape_sed() {
    echo "$1" | sed -e 's/[\/&]/\\&/g'
}

ESC_OLD_MCP="$(escape_sed "${OLD_MCP_URL}")"
ESC_NEW_MCP="$(escape_sed "${NEW_MCP_URL}")"
ESC_OLD_BASE="$(escape_sed "${OLD_BASE_URL}")"
ESC_NEW_BASE="$(escape_sed "${NEW_BASE_URL}")"

CHANGED_COUNT=0

# 查找所有相关文件并逐一替换
while IFS= read -r -d '' file; do
    filename="$(basename "$file")"
    if [ "$filename" = "replace_endpoint.sh" ] || [ "$filename" = "replace_endpoint.py" ]; then
        continue
    fi

    if grep -Fq "${OLD_BASE_URL}" "$file"; then
        if [ "$IS_MAC" = true ]; then
            sed -i '' -e "s/${ESC_OLD_MCP}/${ESC_NEW_MCP}/g" -e "s/${ESC_OLD_BASE}/${ESC_NEW_BASE}/g" "$file"
        else
            sed -i -e "s/${ESC_OLD_MCP}/${ESC_NEW_MCP}/g" -e "s/${ESC_OLD_BASE}/${ESC_NEW_BASE}/g" "$file"
        fi
        rel_path="${file#$ROOT_DIR/}"
        echo " ✓ ${rel_path}"
        CHANGED_COUNT=$((CHANGED_COUNT + 1))
    fi
done < <(find "${ROOT_DIR}" \
    -type d \( -name ".git" -o -name ".idea" -o -name ".vscode" -o -name "node_modules" -o -name "target" \) -prune -o \
    -type f \( -name "*.md" -o -name "*.json" -o -name "*.py" -o -name "*.sh" -o -name "*.yml" -o -name "*.yaml" -o -name "*.svg" \) -print0)

echo "-----------------------------------------------------------------"
echo "替换成功！已完成 ${CHANGED_COUNT} 个文件的端点地址更新。"
echo "================================================================="

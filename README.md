# @xjt-demo/xjt-weather-mcp

基于 [MCP 官方 Weather Server Quickstart](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/examples/server-quickstart/src/index.ts) 实现的天气 MCP Server，数据源为[高德地图天气查询 API](https://lbs.amap.com/api/webservice/guide/api/weatherinfo/)，可通过 `npx` 直接运行，无需本地安装。

## 前置条件

1. 在 [高德开放平台](https://lbs.amap.com/) 注册并创建应用
2. 申请 **Web 服务** 类型的 API Key
3. 在 MCP 配置中通过环境变量 `AMAP_API_KEY` 传入 Key

城市编码（adcode）可参考[高德城市编码表](https://lbs.amap.com/api/webservice/download)，例如：

| 城市 | adcode |
|------|--------|
| 北京东城 | `110101` |
| 上海 | `310100` |
| 广州 | `440100` |
| 深圳 | `440300` |

## MCP Tools

| Tool | 说明 |
|------|------|
| `get-weather-live` | 查询指定城市的实况天气 |
| `get-weather-forecast` | 查询指定城市的天气预报（当天 + 未来 3 天） |

两个工具均接受 `city` 参数：支持**城市名称**（如 `上海`、`北京东城`）或 **6 位 adcode**（如 `310100`）。

## Cursor / Claude 配置

发布到 npm 后，使用者无需手动安装依赖。`npx` 会自动下载包及其 `dependencies`，然后启动 MCP Server。

```json
{
  "mcpServers": {
    "xjtWeather": {
      "command": "npx",
      "args": ["-y", "@xjt-demo/xjt-weather-mcp"],
      "env": {
        "AMAP_API_KEY": "你的高德 Web 服务 Key"
      }
    }
  }
}
```

预发布通道：

```json
{
  "mcpServers": {
    "xjtWeatherAlpha": {
      "command": "npx",
      "args": ["-y", "@xjt-demo/xjt-weather-mcp@alpha"],
      "env": {
        "AMAP_API_KEY": "你的高德 Web 服务 Key"
      }
    }
  }
}
```

## 本地开发

```bash
npm install
npm run build
AMAP_API_KEY=你的Key npm run dev
```

本地调试配置：

```json
{
  "mcpServers": {
    "xjtWeatherLocal": {
      "command": "node",
      "args": ["/path/to/xjt-weather-mcp/dist/server.js"],
      "env": {
        "AMAP_API_KEY": "你的高德 Web 服务 Key"
      }
    }
  }
}
```

运行集成测试前， 在`.env` 文件中填入 Key（`.env` 已被 git 忽略）：

使用 MCP Inspector 调试：

```bash
AMAP_API_KEY=你的Key npx @modelcontextprotocol/inspector node dist/server.js
```

## 开发与发布流程

本仓库采用 **main（稳定）+ alpha（预发布）** 双分支策略：

| 分支 | 用途 | 发布命令 | npm dist-tag | 版本示例 |
|------|------|----------|--------------|----------|
| `alpha` | 新功能开发、预发布验证 | `pnpm release:alpha` | `alpha` | `1.2.0-alpha.0` |
| `main` / `master` | 稳定版 | `pnpm release:stable` | `latest` | `1.2.0` |

### 日常开发

- **新功能、较大改动**：在 `alpha` 分支开发；需要对外验证时执行 `pnpm release:alpha`
- **小 bugfix、文档修正**：可直接在 `main` 修改；发布后同步回 `alpha`（`git checkout alpha && git merge main`）

### 发布路径

**路径 A：新功能（走 alpha）**

```bash
npm login
git checkout alpha
# 开发、提交后
pnpm release:alpha

# 验证通过后
git checkout main
git merge alpha
pnpm release:stable
```

**路径 B：紧急修复（走 main）**

```bash
git checkout main
# 修复、提交后
pnpm release:stable

# 同步到 alpha
git checkout alpha
git merge main
```

### 版本号选择

| 变更类型 | 版本 | 示例 |
|----------|------|------|
| Bug 修复 | PATCH | `1.1.0` → `1.1.1` |
| 新功能（向后兼容） | MINOR | `1.1.0` → `1.2.0` |
| 破坏性变更 | MAJOR | `1.x` → `2.0.0` |
| 仅发布配置 / 文档 | 不发版 | — |

### 用户安装

```bash
npx @xjt-demo/xjt-weather-mcp              # latest（稳定版）
npx @xjt-demo/xjt-weather-mcp@alpha        # alpha 预发布版
```

`release-it` 会在发布前自动执行 `typecheck` 与 `build`；仅在对应分支上才能发布（见 `.release-it.json` / `.release-it.alpha.json`）。

## License

MIT

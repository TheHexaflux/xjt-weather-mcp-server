# @xjt/xjt-weather-mcp

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

两个工具均接受 `city` 参数：6 位数字 adcode。

## Cursor / Claude 配置

发布到 npm 后，使用者无需手动安装依赖。`npx` 会自动下载包及其 `dependencies`，然后启动 MCP Server。

```json
{
  "mcpServers": {
    "xjtWeather": {
      "command": "npx",
      "args": ["-y", "@xjt/xjt-weather-mcp"],
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
      "args": ["-y", "@xjt/xjt-weather-mcp@alpha"],
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

## 发布到 npm

```bash
npm login
npm run build
npm publish --tag alpha   # 预发布
# 或
npm publish             # 稳定版
```

`prepublishOnly` 会在发布前自动执行 `npm run build`。

## License

MIT

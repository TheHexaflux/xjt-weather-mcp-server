/**
 * 高德天气 MCP Server
 *
 * 通过 stdio 与 MCP Client（如 Cursor）通信，暴露天气查询工具。
 * 数据源：高德 Web 服务「天气查询」API
 * @see https://lbs.amap.com/api/webservice/guide/api/weatherinfo/
 */
import { createRequire } from 'node:module';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import type {
  AmapWeatherExtensions,
  AmapWeatherResponse,
  ForecastCast,
  LiveWeather
} from './types/amap-weather.ts';

const require = createRequire(import.meta.url);
const { version: PACKAGE_VERSION } = require('../package.json') as { version: string };

/** 高德天气查询接口 */
const AMAP_WEATHER_API = 'https://restapi.amap.com/v3/weather/weatherInfo';

const server = new McpServer({
  name: 'xjt-weather-mcp',
  version: PACKAGE_VERSION
});

/** 从环境变量读取 Key，需在 MCP 配置的 env 中设置 AMAP_API_KEY */
function getAmapApiKey(): string | null {
  const key = process.env.AMAP_API_KEY?.trim();
  return key || null;
}

/** MCP 工具统一返回结构：未配置 Key 时的提示 */
function missingApiKeyResponse() {
  return {
    content: [
      {
        type: 'text' as const,
        text: '未配置高德 API Key。请在 MCP 配置中设置环境变量 AMAP_API_KEY（Web 服务类型 Key）。申请地址：https://lbs.amap.com/'
      }
    ]
  };
}

/**
 * 请求高德天气 API
 * @param extensions - `base` 实况天气；`all` 预报天气（当天 + 未来 3 天）
 */
async function fetchAmapWeather(
  city: string,
  extensions: AmapWeatherExtensions
): Promise<AmapWeatherResponse | null> {
  const key = getAmapApiKey();
  if (!key) {
    return null;
  }

  const url = new URL(AMAP_WEATHER_API);
  url.searchParams.set('key', key);
  url.searchParams.set('city', city);
  url.searchParams.set('extensions', extensions);
  url.searchParams.set('output', 'JSON');

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP 错误！状态码: ${response.status}`);
    }
    return (await response.json()) as AmapWeatherResponse;
  } catch (error) {
    console.error('高德天气请求出错:', error);
    return null;
  }
}

/** 高德 API 成功时 status=1 且 infocode=10000 */
function isAmapSuccess(data: AmapWeatherResponse): boolean {
  return data.status === '1' && data.infocode === '10000';
}

/** 将实况天气格式化为可读文本 */
function formatLiveWeather(live: LiveWeather): string {
  return [
    `${live.province || '未知'} ${live.city || '未知'}（${live.adcode || '未知'}）`,
    `天气: ${live.weather || '未知'}`,
    `温度: ${live.temperature ?? '未知'}°C`,
    `风向: ${live.winddirection || '未知'}`,
    `风力: ${live.windpower || '未知'} 级`,
    `湿度: ${live.humidity ?? '未知'}%`,
    `发布时间: ${live.reporttime || '未知'}`
  ].join('\n');
}

/** 将单日预报格式化为可读文本 */
function formatForecastCast(cast: ForecastCast): string {
  return [
    `${cast.date || '未知'} 星期${cast.week || '?'}`,
    `白天: ${cast.dayweather || '未知'}，${cast.daytemp ?? '?'}°C，${cast.daywind || '未知'} ${cast.daypower || '?'} 级`,
    `夜间: ${cast.nightweather || '未知'}，${cast.nighttemp ?? '?'}°C，${cast.nightwind || '未知'} ${cast.nightpower || '?'} 级`,
    '---'
  ].join('\n');
}

/** 高德 city 参数要求 6 位 adcode，见 https://lbs.amap.com/api/webservice/download */
const citySchema = z
  .string()
  .regex(/^\d{6}$/)
  .describe('城市 adcode，6 位数字（例如 110101 北京东城，310100 上海）');

// --- MCP Tools ---

server.tool(
  'get-weather-live',
  '获取指定城市的实况天气（高德地图）。',
  { city: citySchema },
  async ({ city }) => {
    if (!getAmapApiKey()) {
      return missingApiKeyResponse();
    }

    const data = await fetchAmapWeather(city, 'base');
    if (!data) {
      return {
        content: [{ type: 'text', text: '获取实况天气失败，请稍后重试' }]
      };
    }

    if (!isAmapSuccess(data)) {
      return {
        content: [{ type: 'text', text: `高德 API 返回错误：${data.info}（${data.infocode}）` }]
      };
    }

    const lives = data.lives || [];
    if (lives.length === 0) {
      return {
        content: [{ type: 'text', text: `未找到 adcode ${city} 的实况天气数据` }]
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `实况天气：\n\n${lives.map(formatLiveWeather).join('\n\n')}`
        }
      ]
    };
  }
);

server.tool(
  'get-weather-forecast',
  '获取指定城市的天气预报，包含当天及未来 3 天（高德地图）。',
  { city: citySchema },
  async ({ city }) => {
    if (!getAmapApiKey()) {
      return missingApiKeyResponse();
    }

    const data = await fetchAmapWeather(city, 'all');
    if (!data) {
      return {
        content: [{ type: 'text', text: '获取天气预报失败，请稍后重试' }]
      };
    }

    if (!isAmapSuccess(data)) {
      return {
        content: [{ type: 'text', text: `高德 API 返回错误：${data.info}（${data.infocode}）` }]
      };
    }

    const forecasts = data.forecasts || [];
    if (forecasts.length === 0) {
      return {
        content: [{ type: 'text', text: `未找到 adcode ${city} 的预报数据` }]
      };
    }

    const formatted = forecasts.map((forecast) => {
      const casts = forecast.casts || [];
      const header = [
        `${forecast.province || '未知'} ${forecast.city || '未知'}（${forecast.adcode || city}）`,
        `预报发布时间: ${forecast.reporttime || '未知'}`,
        ''
      ].join('\n');
      const body =
        casts.length > 0
          ? casts.map(formatForecastCast).join('\n')
          : '无可用预报数据';
      return `${header}${body}`;
    });

    return {
      content: [
        {
          type: 'text',
          text: `天气预报：\n\n${formatted.join('\n\n')}`
        }
      ]
    };
  }
);

async function main() {
  // MCP 标准传输方式：通过 stdin/stdout 与 Client 交换 JSON-RPC 消息
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // 日志必须走 stderr，stdout 留给 MCP 协议通信
  console.error('@xjt-demo/xjt-weather-mcp 已通过 stdio 运行（数据源：高德天气）');
}

main().catch((error) => {
  console.error('main() 发生致命错误:', error);
  process.exit(1);
});

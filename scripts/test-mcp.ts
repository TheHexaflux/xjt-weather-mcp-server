#!/usr/bin/env node
import dotenv from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const serverEntry = join(projectRoot, 'dist/server.js');

dotenv.config({ path: join(projectRoot, '.env') });

async function main() {
  const apiKey = process.env.AMAP_API_KEY?.trim();
  console.log(`测试目标: ${serverEntry}`);
  console.log(`API Key: ${apiKey ? '已配置' : '未配置，请在.env文件通过AMAP_API_KEY=xxx形式设置你的密钥'}`);

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverEntry],
    env: process.env as Record<string, string>,
    stderr: 'pipe',
    cwd: projectRoot
  });

  const client = new Client({ name: 'mcp-test-client', version: '1.0.0' });

  try {
    await client.connect(transport);
    console.log('✓ MCP 连接成功');

    const { tools } = await client.listTools();
    console.log(`✓ 工具列表 (${tools.length}): ${tools.map((t) => t.name).join(', ')}`);

    for (const [toolName, city] of [
      ['get-weather-live', '310100'],
      ['get-weather-forecast', '310100'],
      ['get-weather-live', '上海'],
      ['get-weather-forecast', '深圳']
    ] as const) {
      console.log(`\n--- 调用 ${toolName} (city=${city}) ---`);
      const result = await client.callTool({
        name: toolName,
        arguments: { city }
      });

      if (result.isError) {
        console.log('✗ 工具返回错误');
      } else {
        console.log('✓ 工具调用成功');
      }

      const content = Array.isArray(result.content) ? result.content : [];
      for (const item of content) {
        if (item.type === 'text') {
          console.log(item.text);
        }
      }
    }

    console.log('\n--- 调用 get-weather-live (无效 city=xyznotacity) ---');
    const invalidResult = await client.callTool({
      name: 'get-weather-live',
      arguments: { city: 'xyznotacity' }
    });
    const invalidContent = Array.isArray(invalidResult.content) ? invalidResult.content : [];
    const invalidText = invalidContent.find((item) => item.type === 'text')?.text ?? '';
    if (!invalidResult.isError && invalidText.includes('未找到城市')) {
      console.log('✓ 无效城市名正常返回友好提示');
    } else {
      console.log('✗ 预期应提示未找到城市，但未返回预期信息');
    }

    console.log('\n--- 调用 get-weather-live (空 city) ---');
    const emptyResult = await client.callTool({
      name: 'get-weather-live',
      arguments: { city: '   ' }
    });
    if (emptyResult.isError) {
      console.log('✓ 空城市名正常被参数校验拦截');
    } else {
      console.log('✗ 预期应校验失败，但未报错');
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('测试失败:', error);
  process.exit(1);
});

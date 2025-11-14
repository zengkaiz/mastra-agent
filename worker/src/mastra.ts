import { Mastra } from '@mastra/core/mastra';
import { createInterviewAgent } from './agent';
import { Env } from './types';

// 获取或创建 Mastra 实例
// 注意：在 Cloudflare Workers 中，为了确保环境变量始终正确传递，
// 我们每次都创建新的 Agent 实例（Agent 轻量级，性能影响很小）
export function getMastra(env: Env): Mastra {
  console.log('Creating new Mastra instance with env');

  // 确保环境变量存在
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured in environment');
  }

  const interviewAgent = createInterviewAgent(env);

  const mastraInstance = new Mastra({
    agents: { interviewAgent },
  });

  return mastraInstance;
}

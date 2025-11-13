import { Mastra } from '@mastra/core/mastra';
import { createInterviewAgent } from './agent';
import { Env } from './types';

// Mastra 实例缓存（按环境）
let mastraInstance: Mastra | null = null;

// 获取或创建 Mastra 实例
export function getMastra(env: Env): Mastra {
  // 注意：在 Cloudflare Workers 中，每个请求都有独立的执行上下文
  // 但我们仍然可以缓存实例以提高性能
  if (!mastraInstance) {
    const interviewAgent = createInterviewAgent(env);

    mastraInstance = new Mastra({
      agents: { interviewAgent },
    });
  }

  return mastraInstance;
}

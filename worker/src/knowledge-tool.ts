import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Env } from './types';
import { searchVectorize } from './vectorize';

// 知识库检索工具（供 Mastra Agent 使用）
export function createKnowledgeBaseTool(env: Env) {
  return createTool({
    id: 'search_knowledge_base',
    description:
      'Search the knowledge base (resume and interview experience) for relevant information to help answer interview questions.',
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          'The search query to find relevant information from the knowledge base'
        ),
    }),
    execute: async ({ context, ...params }) => {
      // 参数可能在 context 或直接在 params 中
      const query = (params as any).query || (context as any)?.query;

      if (!query || typeof query !== 'string') {
        return {
          success: false,
          error: 'Query parameter is required and must be a string.',
        };
      }

      try {
        console.log('Searching knowledge base with query:', query);
        const results = await searchVectorize(env, query, 3);

        if (results.length === 0) {
          return {
            success: true,
            data: 'No relevant information found in the knowledge base.',
          };
        }

        // 格式化检索结果
        const formattedResults = results
          .map((result, index) => {
            return `[${index + 1}] ${result.text}\n   Source: ${
              result.metadata?.filename || 'Unknown'
            }`;
          })
          .join('\n\n');

        return {
          success: true,
          data: `Found ${results.length} relevant information:\n\n${formattedResults}`,
        };
      } catch (error) {
        console.error('Knowledge base search error:', error);
        return {
          success: false,
          error: 'Error searching the knowledge base.',
        };
      }
    },
  });
}

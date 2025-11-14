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
    outputSchema: z.string().describe('The search results from the knowledge base'),
    execute: async ({ context, ...params }) => {
      console.log('🔍🔍🔍 Knowledge base tool EXECUTED!');

      // 参数可能在 context 或直接在 params 中
      const query = (params as any).query || (context as any)?.query;

      console.log('🔍 Knowledge base search initiated');
      console.log('   - Query:', query);
      console.log('   - Params:', JSON.stringify(params));
      console.log('   - Context keys:', Object.keys(context || {}));

      if (!query || typeof query !== 'string') {
        console.error('❌ Invalid query parameter');
        return 'Error: Query parameter is required and must be a string.'; // 直接返回字符串
      }

      try {
        console.log('🔎 Searching knowledge base with query:', query);
        const results = await searchVectorize(env, query, 5); // 增加到 5 个结果
        console.log(`📊 Search returned ${results.length} results`);

        if (results.length === 0) {
          console.log('⚠️  No results found in knowledge base');
          const noResultsMessage = 'No relevant information found in the knowledge base.';
          console.log('🔙 Returning to agent:', noResultsMessage);
          return noResultsMessage; // 直接返回字符串
        }

        // 格式化检索结果
        const formattedResults = results
          .map((result, index) => {
            console.log(`   Result ${index + 1}: score=${result.score}, text length=${result.text?.length}`);
            console.log(`   Result ${index + 1} text preview:`, result.text?.substring(0, 100));
            return `[${index + 1}] ${result.text}\n   Source: ${
              result.metadata?.filename || 'Unknown'
            }\n   Relevance: ${(result.score * 100).toFixed(1)}%`;
          })
          .join('\n\n');

        const responseText = `Found ${results.length} relevant information from resume:\n\n${formattedResults}`;
        console.log('✅ Knowledge base search successful');
        console.log('🔙 Returning to agent (length):', responseText.length);
        console.log('🔙 Response preview:', responseText.substring(0, 200));

        return responseText; // 直接返回字符串，不要包装在对象中
      } catch (error) {
        console.error('❌ Knowledge base search error:', error);
        const errorMessage = `Error searching the knowledge base: ${error instanceof Error ? error.message : String(error)}`;
        console.log('🔙 Returning error to agent:', errorMessage);
        return errorMessage; // 直接返回错误字符串
      }
    },
  });
}

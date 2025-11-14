import { GraphQLContext } from './types';
import { getMastra } from './mastra';
import { extractTextFromPDF, chunkText } from './pdf-processor';
import { storeInVectorize } from './vectorize';

// Chat Query Resolver
export const chatResolver = async (
  _: any,
  { message }: { message: string },
  context: GraphQLContext
) => {
  try {
    console.log('Chat resolver called with message:', message);

    if (!message || typeof message !== 'string') {
      return {
        reply: 'Please provide a valid message.',
      };
    }

    if (!context.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set');
      return {
        reply: 'Server configuration error: OpenAI API key is missing.',
      };
    }

    // 通过 Mastra 实例获取 agent（推荐方式）
    const mastra = getMastra(context.env);
    const agent = mastra.getAgent('interviewAgent');
    console.log('Agent retrieved from Mastra successfully');

    // 运行 Mastra Agent
    console.log('🚀 Calling agent.generate with message:', message);
    console.log('📋 Agent has tools:', Object.keys(agent.tools || {}));

    const result = await agent.generate(message);

    console.log('✅ Agent generate completed');
    console.log('📊 Result summary:', {
      hasText: !!result.text,
      textLength: result.text?.length,
      toolCalls: result.toolCalls?.length || 0,
      toolResults: result.toolResults?.length || 0,
    });

    // 记录工具调用详情
    if (result.toolCalls && result.toolCalls.length > 0) {
      console.log('🔧 Tools called:', result.toolCalls.map((tc: any) => tc.toolName || tc.id));
      console.log('🔧 Tool call details:', JSON.stringify(result.toolCalls, null, 2));
    } else {
      console.warn('⚠️ No tools were called by the agent!');
    }

    if (result.toolResults && result.toolResults.length > 0) {
      console.log('📦 Tool results count:', result.toolResults.length);
      result.toolResults.forEach((tr: any, idx: number) => {
        console.log(`📦 Tool result #${idx + 1}:`, {
          toolName: tr.toolName,
          resultType: typeof tr.result,
          resultPreview: tr.result
            ? (typeof tr.result === 'string' ? tr.result.substring(0, 200) : JSON.stringify(tr.result).substring(0, 200))
            : 'undefined',
        });
      });
    }

    if (!result || !result.text) {
      console.error('Agent returned invalid result:', result);
      return {
        reply: 'Sorry, I could not generate a response. Please try again.',
      };
    }

    return {
      reply: result.text,
    };
  } catch (error) {
    console.error('Chat error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      reply: `An error occurred: ${errorMessage}. Please check the server logs for more details.`,
    };
  }
};

// Upload PDF Mutation Resolver
export const uploadPDFResolver = async (
  _: any,
  { file }: { file: File },
  context: GraphQLContext
) => {
  try {
    // 验证文件类型
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return {
        success: false,
        message: 'Only PDF files are supported.',
      };
    }

    // 验证文件大小（限制为 10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        message: 'File size exceeds 10MB limit.',
      };
    }

    // 提取 PDF 文本
    const text = await extractTextFromPDF(file);

    if (!text || text.length < 50) {
      return {
        success: false,
        message:
          'Unable to extract meaningful text from PDF. Please ensure the PDF contains readable text.',
      };
    }

    // 将文本分块
    const chunks = chunkText(text, 1000, 200);

    // 存储到 Vectorize
    await storeInVectorize(context.env, chunks, {
      filename: file.name,
      uploadedAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: `PDF processed successfully. ${chunks.length} chunks stored in knowledge base.`,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to upload and process PDF',
    };
  }
};

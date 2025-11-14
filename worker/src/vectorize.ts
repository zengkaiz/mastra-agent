import { Env } from './types';

type OpenAIEmbeddingResponse = {
  data: Array<{
    embedding: number[];
  }>;
};

// 生成文本向量（使用 OpenAI Embeddings）
export async function generateEmbedding(
  text: string,
  apiKey: string
): Promise<number[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small', // 使用小型模型降低成本
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = (await response.json()) as OpenAIEmbeddingResponse;
    const embedding = data?.data?.[0]?.embedding;

    if (!Array.isArray(embedding)) {
      throw new Error('Failed to retrieve embedding from OpenAI response');
    }

    return embedding;
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw error;
  }
}

// 将文档存储到 Vectorize（流式处理以避免内存溢出）
export async function storeInVectorize(
  env: Env,
  textChunks: string[],
  metadata: { filename: string; uploadedAt: string }
): Promise<void> {
  try {
    let totalStored = 0;

    // 流式处理：每次只处理一个 chunk，立即存储，避免内存累积
    // 这样可以在 Durable Object 的内存限制内工作
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];

      try {
        // 1. 生成 embedding（一次一个，减少内存占用）
        console.log(`[${i + 1}/${textChunks.length}] Generating embedding...`);
        const embedding = await generateEmbedding(chunk, env.OPENAI_API_KEY);

        // 2. 立即创建 vector 对象
        const vector = {
          id: `${metadata.filename}-chunk-${i}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          values: embedding,
          metadata: {
            ...metadata,
            chunkIndex: i,
            text: chunk, // 存储完整文本（Vectorize 支持最多 40KB metadata）
          },
        };

        // 3. 立即存储到 Vectorize（单个），释放内存
        await env.VECTORIZE.upsert([vector]);
        totalStored++;
        console.log(`✓ Stored chunk ${i + 1}/${textChunks.length}`);

        // 4. 释放引用，帮助 GC
        // @ts-ignore
        embedding.length = 0;
      } catch (chunkError: any) {
        // 在本地开发环境，Vectorize 不可用
        if (chunkError?.message?.includes('needs to be run remotely')) {
          console.warn('⚠️  Vectorize is not available in local development. Skipping vector storage.');
          return;
        }
        console.error(`Failed to process chunk ${i}:`, chunkError);
        throw chunkError;
      }
    }

    console.log(`✓ Successfully stored ${totalStored} vectors in Vectorize`);
  } catch (error) {
    console.error('Vectorize storage error:', error);
    throw error;
  }
}

// 从 Vectorize 检索相关文档（使用 Cloudflare AI Workers）
export async function searchVectorize(
  env: Env,
  query: string,
  topK: number = 5
): Promise<
  Array<{ text: string; score: number; metadata: Record<string, any> }>
> {
  try {
    // 使用 Cloudflare AI Workers 生成查询向量
    const embedding = await env.AI.run('@cf/baai/bge-small-en-v1.5', {
      text: query,
    });
    const queryEmbedding = embedding.data[0];

    // 在 Vectorize 中搜索
    const results = await env.VECTORIZE.query(queryEmbedding, {
      topK,
      returnMetadata: true,
    });

    console.log(`Vectorize search returned ${results.matches?.length || 0} results`);

    // 格式化结果
    return (results.matches || []).map((result: any) => ({
      text: (result.metadata?.text as string) || '',
      score: result.score || 0,
      metadata: result.metadata || {},
    }));
  } catch (error: any) {
    // 在本地开发环境，Vectorize 不可用
    if (error?.message?.includes('needs to be run remotely')) {
      console.warn('⚠️  Vectorize is not available in local development. Returning empty results.');
      return [];
    }
    console.error('Vectorize search error:', error);
    return [];
  }
}

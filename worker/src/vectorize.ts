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

// 将文档存储到 Vectorize
export async function storeInVectorize(
  env: Env,
  textChunks: string[],
  metadata: { filename: string; uploadedAt: string }
): Promise<void> {
  try {
    const vectors = await Promise.all(
      textChunks.map(async (chunk, index) => {
        const embedding = await generateEmbedding(chunk, env.OPENAI_API_KEY);
        return {
          id: `${metadata.filename}-chunk-${index}-${Date.now()}`,
          values: embedding,
          metadata: {
            ...metadata,
            chunkIndex: index,
            text: chunk.substring(0, 200), // 存储前200字符作为预览
          },
        };
      })
    );

    // 批量插入到 Vectorize
    // 注意：Cloudflare Vectorize API 通过绑定使用，不需要传递 index name
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await env.VECTORIZE.upsert(batch);
    }

    console.log(`Successfully stored ${vectors.length} vectors in Vectorize`);
  } catch (error) {
    console.error('Vectorize storage error:', error);
    throw error;
  }
}

// 从 Vectorize 检索相关文档
export async function searchVectorize(
  env: Env,
  query: string,
  topK: number = 5
): Promise<
  Array<{ text: string; score: number; metadata: Record<string, any> }>
> {
  try {
    // 生成查询向量
    const queryEmbedding = await generateEmbedding(query, env.OPENAI_API_KEY);

    // 在 Vectorize 中搜索
    // 注意：Cloudflare Vectorize 的 query 方法通过绑定调用
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
  } catch (error) {
    console.error('Vectorize search error:', error);
    return [];
  }
}

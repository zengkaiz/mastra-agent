// 环境变量类型定义
export interface Env {
  OPENAI_API_KEY: string;
  VECTORIZE_INDEX: string;
  VECTORIZE: VectorizeNamespace;
  PDF_BUCKET?: R2Bucket; // 可选：如果配置了 R2 才会有
  PDF_PROCESSOR: DurableObjectNamespace; // Durable Object 用于异步处理 PDF
  AI: any; // Cloudflare AI Workers binding for embeddings
}

// PDF 处理任务类型
export interface PDFProcessTask {
  r2Key: string;
  filename: string;
  uploadedAt: string;
}

// Cloudflare Vectorize 命名空间类型
// 注意：Vectorize 通过绑定使用，不需要传递 index name
export interface VectorizeNamespace {
  query(
    queryVector: number[],
    options?: {
      topK?: number;
      returnValues?: boolean;
      returnMetadata?: boolean;
    }
  ): Promise<{
    matches: Array<{
      id: string;
      score: number;
      values?: number[];
      metadata?: Record<string, any>;
    }>;
  }>;

  insert(
    vectors: Array<{
      id: string;
      values: number[];
      metadata?: Record<string, any>;
    }>
  ): Promise<void>;

  upsert(
    vectors: Array<{
      id: string;
      values: number[];
      metadata?: Record<string, any>;
    }>
  ): Promise<void>;
}

export interface VectorizeQueryResult {
  id: string;
  score: number;
  values?: number[];
  metadata?: Record<string, any>;
}

// GraphQL 上下文类型
export interface GraphQLContext {
  env: Env;
}

import { DurableObject } from 'cloudflare:workers';
import { Env } from './types';
import { extractTextFromPDF } from './pdf-processor';

// PDFProcessor Durable Object - 使用流式处理避免内存溢出
// 使用 Cloudflare AI Workers 生成 embeddings（无需 OpenAI API）
export class PDFProcessor extends DurableObject {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // 接收 vectorize 任务（从 Worker 发送过来的预分块文本）
    if (url.pathname === '/vectorize' && request.method === 'POST') {
      const task = await request.json() as {
        chunks: string[];
        filename: string;
        uploadedAt: string;
      };

      // 异步处理（不阻塞响应）
      this.ctx.waitUntil(this.processChunks(task));

      return new Response(
        JSON.stringify({ success: true, message: 'Vectorization started', chunks: task.chunks.length }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 接收 R2 处理任务（完整的 PDF 处理流程）
    if (url.pathname === '/process' && request.method === 'POST') {
      const task = await request.json() as {
        r2Key: string;
        filename: string;
        uploadedAt: string;
      };

      // 异步处理（不阻塞响应）
      this.ctx.waitUntil(this.processPDFFromR2(task));

      return new Response(
        JSON.stringify({ success: true, message: 'Started processing' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response('Not Found', { status: 404 });
  }

  // 流式 chunk generator（增加 chunk size 以减少总数）
  *chunkGenerator(text: string, size: number = 1000, overlap: number = 200) {
    let start = 0;
    while (start < text.length) {
      yield text.slice(start, Math.min(start + size, text.length));
      start += size - overlap;
    }
  }

  // 生成安全的短 ID（16 字节十六进制 = 32 字符）
  async generateShortId(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // 取前 8 字节转十六进制（16 字符）
    return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 处理预先分块的文本（从 Worker 接收）
  async processChunks(task: {
    chunks: string[];
    filename: string;
    uploadedAt: string;
  }): Promise<void> {
    const { chunks, filename, uploadedAt } = task;
    console.log(`🔄 [DO] Processing ${chunks.length} chunks for ${filename}`);

    let index = 0;
    // 创建安全的短文件标识符（16 字节）
    const fileHash = await this.generateShortId(filename + uploadedAt);

    try {
      // 逐个处理 chunk，避免内存累积
      for (const chunk of chunks) {
        console.log(`➡️ [DO] Processing chunk #${index + 1}/${chunks.length} (${chunk.length} chars)`);

        // 使用 Cloudflare AI Workers 生成 embedding
        const embedding = await this.env.AI.run('@cf/baai/bge-small-en-v1.5', {
          text: chunk,
        });

        // 生成唯一 ID（总长度 < 32 字节）
        const vectorId = `${fileHash}-${index}`;

        // 立即存储到 Vectorize
        await this.env.VECTORIZE.upsert([
          {
            id: vectorId,
            values: embedding.data[0], // BGE model returns array of embeddings
            metadata: {
              filename,
              chunkIndex: index,
              uploadedAt,
              text: chunk, // 存储原文本用于检索
            },
          },
        ]);

        console.log(`✓ [DO] Stored chunk ${index + 1}/${chunks.length} (id: ${vectorId})`);
        index++;

        // 手动释放内存引用
        (embedding as any).data = null;
      }

      console.log(`🎉 [DO] Completed! Total chunks: ${index}`);
    } catch (error) {
      console.error(`❌ [DO] Processing failed:`, error);
      throw error;
    }
  }

  // 从 R2 处理 PDF（完整流程：下载 → 提取文本 → 分块 → 批量向量化）
  async processPDFFromR2(task: {
    r2Key: string;
    filename: string;
    uploadedAt: string;
  }): Promise<void> {
    const { r2Key, filename, uploadedAt } = task;

    console.log(`📄 [DO] Start processing from R2: ${filename}`);

    try {
      // 从 R2 获取文件
      const r2Obj = await this.env.PDF_BUCKET!.get(r2Key);
      if (!r2Obj) {
        throw new Error('File not found in R2');
      }

      const buf = await r2Obj.arrayBuffer();
      const blob = new Blob([buf], { type: 'application/pdf' });
      const file = new File([blob], filename, { type: 'application/pdf' });

      console.log(`📥 [DO] PDF loaded: ${file.size} bytes`);

      // 提取文本
      const text = await extractTextFromPDF(file);
      console.log(`🔍 [DO] Extracted ${text.length} characters`);

      // 创建安全的短文件标识符
      const fileHash = await this.generateShortId(r2Key);
      console.log(`✂️ [DO] Start batch processing (fileHash: ${fileHash})...`);

      // 批量处理：收集一批 chunks，一起生成 embeddings 和 upsert
      const BATCH_SIZE = 10; // 每批处理 10 个 chunks
      let batch: Array<{ chunk: string; index: number }> = [];
      let index = 0;
      let totalProcessed = 0;

      for (const chunk of this.chunkGenerator(text)) {
        batch.push({ chunk, index });
        index++;

        // 当批次满了或到达最后一个 chunk
        if (batch.length >= BATCH_SIZE) {
          await this.processBatch(batch, fileHash, filename, r2Key, uploadedAt);
          totalProcessed += batch.length;
          console.log(`✓ [DO] Processed ${totalProcessed} chunks so far...`);
          batch = [];
        }
      }

      // 处理剩余的 chunks
      if (batch.length > 0) {
        await this.processBatch(batch, fileHash, filename, r2Key, uploadedAt);
        totalProcessed += batch.length;
      }

      console.log(`🎉 [DO] Completed! Total chunks: ${totalProcessed}`);
    } catch (error) {
      console.error(`❌ [DO] Processing failed:`, error);
      throw error;
    }
  }

  // 批量处理一批 chunks
  private async processBatch(
    batch: Array<{ chunk: string; index: number }>,
    fileHash: string,
    filename: string,
    r2Key: string,
    uploadedAt: string
  ): Promise<void> {
    console.log(`📦 [DO] Processing batch of ${batch.length} chunks...`);

    // 批量生成 embeddings
    const embeddingPromises = batch.map(({ chunk }) =>
      this.env.AI.run('@cf/baai/bge-small-en-v1.5', { text: chunk })
    );

    const embeddings = await Promise.all(embeddingPromises);

    // 准备向量数据
    const vectors = batch.map(({ chunk, index }, i) => ({
      id: `${fileHash}-${index}`,
      values: embeddings[i].data[0],
      metadata: {
        filename,
        r2Key,
        chunkIndex: index,
        uploadedAt,
        text: chunk,
      },
    }));

    // 批量 upsert
    await this.env.VECTORIZE.upsert(vectors);

    console.log(`✓ [DO] Batch stored: chunks ${batch[0].index} to ${batch[batch.length - 1].index}`);

    // 释放内存
    embeddings.forEach((emb: any) => {
      emb.data = null;
    });
  }
}

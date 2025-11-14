import { Env } from './types';
import { getFromR2 } from './r2-handler';
import { extractTextFromPDF, chunkText } from './pdf-processor';
import { storeInVectorize } from './vectorize';

// 异步处理 PDF（从 R2 读取并向量化）
export async function processPDFAsync(
  env: Env,
  r2Key: string,
  filename: string
): Promise<void> {
  try {
    console.log(`[Async] Starting PDF processing for: ${r2Key}`);

    // 从 R2 获取文件
    const r2Object = await getFromR2(env, r2Key);
    if (!r2Object) {
      throw new Error('File not found in R2');
    }

    // 将 R2 对象转换为 File 类型
    const arrayBuffer = await r2Object.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const file = new File([blob], filename, { type: 'application/pdf' });

    console.log(`[Async] File retrieved from R2: ${file.size} bytes`);

    // 提取文本
    const text = await extractTextFromPDF(file);
    if (!text || text.length < 50) {
      throw new Error('Unable to extract meaningful text from PDF');
    }

    console.log(`[Async] Text extracted: ${text.length} characters`);

    // 分块
    const chunks = chunkText(text, 1500, 200);
    console.log(`[Async] Text chunked into ${chunks.length} pieces`);

    // 存储到 Vectorize
    await storeInVectorize(env, chunks, {
      filename,
      uploadedAt: new Date().toISOString(),
    });

    console.log(`[Async] ✓ PDF processing completed for: ${filename}`);
  } catch (error) {
    console.error(`[Async] PDF processing failed for ${r2Key}:`, error);
    throw error;
  }
}

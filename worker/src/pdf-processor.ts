// PDF 文本提取（使用简化的文本提取方法）
// 注意：Cloudflare Workers 环境限制，使用简化实现
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // 将 PDF 转换为文本（简化版）
    // PDF 文件结构中，文本内容通常在特定的标记之间
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawText = decoder.decode(uint8Array);

    // 提取文本内容的正则表达式
    // PDF 中的文本通常在 BT (Begin Text) 和 ET (End Text) 之间
    const textMatches = rawText.match(/\(([^)]+)\)/g);

    if (!textMatches || textMatches.length === 0) {
      // 如果没有找到括号内的文本，尝试提取可打印字符
      const printableText = rawText
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // 保留可打印字符
        .replace(/\s+/g, ' ')
        .trim();

      if (printableText.length < 50) {
        throw new Error('Unable to extract meaningful text from PDF');
      }

      console.log(`PDF text extracted (fallback method): ${printableText.length} characters`);
      return printableText;
    }

    // 提取括号内的文本并清理
    const extractedText = textMatches
      .map(match => match.slice(1, -1)) // 移除括号
      .join(' ')
      .replace(/\\[nrt]/g, ' ') // 替换转义字符
      .replace(/\s+/g, ' ')
      .trim();

    if (extractedText.length < 50) {
      throw new Error('Extracted text is too short. PDF may not contain readable text.');
    }

    console.log(`PDF text extracted: ${extractedText.length} characters`);
    return extractedText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 将文本分块（用于向量化）
export function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
  }

  return chunks;
}

// PDF 文本提取（使用 unpdf 库 - Cloudflare Workers 兼容）
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // 动态导入 unpdf
    const { extractText } = await import('unpdf');

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();

    console.log('📄 Extracting PDF with unpdf, size:', arrayBuffer.byteLength, 'bytes');

    // 使用 unpdf 提取文本
    const { text, totalPages } = await extractText(new Uint8Array(arrayBuffer));

    console.log(`📄 PDF processed: ${totalPages} pages`);
    console.log(`📝 Extracted ${text.length} characters`);

    if (!text || text.length < 50) {
      throw new Error('Extracted text is too short. PDF may not contain readable text.');
    }

    // 清理文本
    const cleanedText = text
      .replace(/\s+/g, ' ')  // 规范化空格
      .trim();

    console.log(`✅ PDF text extracted with unpdf: ${cleanedText.length} characters`);
    console.log(`📖 Text preview:`, cleanedText.substring(0, 300));

    return cleanedText;

  } catch (error) {
    console.error('❌ PDF extraction with unpdf failed:', error);
    console.log('⚠️ Falling back to simple text extraction...');

    // 回退到简单方法
    return extractTextFromPDFSimple(file);
  }
}

// 简单的 PDF 文本提取（回退方法 - 专门处理 ReportLab PDF）
async function extractTextFromPDFSimple(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const decoder = new TextDecoder('latin1', { fatal: false });
  const rawText = decoder.decode(uint8Array);

  console.log('🔍 Analyzing PDF structure...');

  // 提取所有文本内容（包括 Tj, TJ 操作符）
  const textBlocks: string[] = [];

  // 方法 1: 匹配所有括号内的文本（更宽松的匹配）
  const allTextMatches = rawText.match(/\(([^)]{2,}?)\)/g);

  if (allTextMatches) {
    console.log(`   Found ${allTextMatches.length} text segments`);

    allTextMatches.forEach((match, idx) => {
      let text = match.slice(1, -1)
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\t/g, ' ')
        .replace(/\\([()])/g, '$1')
        .replace(/\\\\/g, '\\');

      // 更严格的元数据过滤
      const isMetadata =
        text.includes('ReportLab') ||
        text.includes('PDF Library') ||
        text.includes('www.reportlab') ||
        /^D:\d{14}/.test(text) ||  // 日期格式
        text === 'anonymous' ||
        text === 'unspecified' ||
        /^[0-9A-Za-z]{40,}$/.test(text) || // 长哈希值
        text.length <= 2;

      if (!isMetadata) {
        textBlocks.push(text);
        if (idx < 20) {
          console.log(`   Segment ${idx}: "${text.substring(0, 50)}"`);
        }
      }
    });
  }

  // 方法 2: 尝试提取 stream...endstream 中的内容
  if (textBlocks.length === 0) {
    console.log('⚠️ Method 1 failed, trying stream extraction...');
    const streamRegex = /stream\s+([\s\S]+?)\s+endstream/g;
    let streamMatch;

    while ((streamMatch = streamRegex.exec(rawText)) !== null) {
      const streamContent = streamMatch[1];
      const streamTexts = streamContent.match(/\(([^)]{3,}?)\)/g);
      if (streamTexts) {
        streamTexts.forEach(st => {
          const text = st.slice(1, -1);
          if (!text.includes('ReportLab') && text.length > 2) {
            textBlocks.push(text);
          }
        });
      }
    }
  }

  const extractedText = textBlocks.join(' ').replace(/\s+/g, ' ').trim();

  console.log(`📝 Extracted ${textBlocks.length} text blocks, ${extractedText.length} characters`);
  console.log(`📖 Text preview:`, extractedText.substring(0, 300));

  if (extractedText.length < 50) {
    console.error('❌ Extraction failed - text too short');
    console.error('💡 Suggestion: This PDF may use compressed streams or embedded fonts.');
    console.error('💡 Please try:');
    console.error('   1. Export PDF as text from your PDF reader');
    console.error('   2. Or copy-paste resume content directly');
    throw new Error('Unable to extract meaningful text from PDF. Please export as text or copy content directly.');
  }

  console.log(`✅ PDF text extracted (fallback): ${extractedText.length} characters`);

  return extractedText;
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

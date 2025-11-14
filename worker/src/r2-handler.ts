import { Env } from './types';

// 将文件上传到 R2
export async function uploadToR2(
  env: Env,
  file: File
): Promise<{ key: string; size: number }> {
  try {
    // 生成唯一的文件 key
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const key = `pdfs/${timestamp}-${randomId}-${file.name}`;

    // 上传到 R2
    const arrayBuffer = await file.arrayBuffer();
    await env.PDF_BUCKET.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: 'application/pdf',
      },
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    console.log(`✓ File uploaded to R2: ${key} (${file.size} bytes)`);

    return {
      key,
      size: file.size,
    };
  } catch (error) {
    console.error('Failed to upload to R2:', error);
    throw new Error('Failed to upload file to storage');
  }
}

// 从 R2 获取文件
export async function getFromR2(env: Env, key: string): Promise<R2ObjectBody | null> {
  try {
    const object = await env.PDF_BUCKET.get(key);
    return object;
  } catch (error) {
    console.error('Failed to get from R2:', error);
    return null;
  }
}

// 从 R2 删除文件
export async function deleteFromR2(env: Env, key: string): Promise<void> {
  try {
    await env.PDF_BUCKET.delete(key);
    console.log(`✓ File deleted from R2: ${key}`);
  } catch (error) {
    console.error('Failed to delete from R2:', error);
    throw error;
  }
}

// 列出 R2 中的所有 PDF 文件
export async function listR2Files(
  env: Env,
  limit: number = 100,
  cursor?: string
): Promise<{ files: Array<{ key: string; size: number; uploaded: Date }>; cursor?: string }> {
  try {
    const listed = await env.PDF_BUCKET.list({
      prefix: 'pdfs/',
      limit,
      cursor,
    });

    const files = listed.objects.map((obj) => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
    }));

    return {
      files,
      cursor: listed.truncated ? listed.cursor : undefined,
    };
  } catch (error) {
    console.error('Failed to list R2 files:', error);
    return { files: [] };
  }
}

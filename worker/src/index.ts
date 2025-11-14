import { handleGraphQLRequest } from './graphql-server';
import { Env, PDFProcessTask } from './types';
import { uploadToR2, listR2Files } from './r2-handler';

// 导出 Durable Object 类
export { PDFProcessor } from './pdf-processor-do';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // CORS 预检请求处理
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // 文件上传端点（新架构：立即存储到 R2，异步处理）
    if (url.pathname === '/upload-pdf' && request.method === 'POST') {
      try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
          return new Response(
            JSON.stringify({ success: false, message: 'No file provided' }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        }

        // 验证文件类型
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          return new Response(
            JSON.stringify({
              success: false,
              message: 'Only PDF files are supported.',
            }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        }

        // 验证文件大小（限制为 10MB）
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          return new Response(
            JSON.stringify({
              success: false,
              message: 'File size exceeds 10MB limit.',
            }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        }

        // 尝试使用 R2 存储（如果可用）
        let useR2 = false;
        let r2Key: string | undefined;

        try {
          if (env.PDF_BUCKET) {
            const result = await uploadToR2(env, file);
            r2Key = result.key;
            useR2 = true;
            console.log('✓ Using R2 storage for async processing');
          }
        } catch (r2Error) {
          console.warn('R2 not available, falling back to direct processing:', r2Error);
        }

        if (useR2 && r2Key) {
          // R2 可用：直接发送任务到 Durable Object 处理
          console.log('📁 File uploaded to R2:', r2Key);
          console.log('🚀 Sending task to Durable Object for processing...');

          try {
            // 获取 Durable Object 实例
            const id = env.PDF_PROCESSOR.idFromName('pdf-processor');
            const stub = env.PDF_PROCESSOR.get(id);

            // 发送 R2 key 到 DO 让它处理完整流程
            const task = {
              r2Key,
              filename: file.name,
              uploadedAt: new Date().toISOString(),
            };

            const doResponse = await stub.fetch('http://internal/process', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(task),
            });

            const doResult = await doResponse.json();
            console.log('✅ Processing task sent to DO:', doResult);

            return new Response(
              JSON.stringify({
                success: true,
                message: `✅ PDF uploaded to R2! Processing in background. Please wait 1-2 minutes before chatting.`,
                key: r2Key,
                filename: file.name,
              }),
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                },
              }
            );
          } catch (doError) {
            console.error('❌ Failed to start PDF processing:', doError);
            return new Response(
              JSON.stringify({
                success: false,
                message: `PDF uploaded but processing failed to start: ${doError instanceof Error ? doError.message : String(doError)}`,
              }),
              {
                status: 500,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                },
              }
            );
          }
        } else {
          // R2 不可用：返回错误（需要 R2 才能使用 Durable Object 处理）
          return new Response(
            JSON.stringify({
              success: false,
              message: 'R2 storage is required for PDF processing. Please configure PDF_BUCKET in wrangler.toml',
            }),
            {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        }
      } catch (error) {
        console.error('Upload error:', error);
        return new Response(
          JSON.stringify({
            success: false,
            message:
              error instanceof Error
                ? error.message
                : 'Failed to upload PDF',
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }

    // 列出已上传的 PDF 文件
    if (url.pathname === '/list-pdfs' && request.method === 'GET') {
      try {
        const { files } = await listR2Files(env);
        return new Response(
          JSON.stringify({
            success: true,
            files,
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      } catch (error) {
        console.error('List files error:', error);
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Failed to list files',
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }

    // 处理 GraphQL 请求（包括 /graphql 路径）
    if (url.pathname === '/graphql' || url.pathname === '/graphql/') {
      return handleGraphQLRequest(request, env);
    }

    // 健康检查端点
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 404
    return new Response('Not Found', {
      status: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};

import { handleGraphQLRequest } from './graphql-server';
import { Env } from './types';
import { extractTextFromPDF, chunkText } from './pdf-processor';
import { storeInVectorize } from './vectorize';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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

    // 文件上传端点（REST API）
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

        // 提取 PDF 文本
        const text = await extractTextFromPDF(file);

        if (!text || text.length < 50) {
          return new Response(
            JSON.stringify({
              success: false,
              message:
                'Unable to extract meaningful text from PDF. Please ensure the PDF contains readable text.',
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

        // 将文本分块
        const chunks = chunkText(text, 1000, 200);

        // 存储到 Vectorize
        await storeInVectorize(env, chunks, {
          filename: file.name,
          uploadedAt: new Date().toISOString(),
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: `PDF processed successfully. ${chunks.length} chunks stored in knowledge base.`,
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      } catch (error) {
        console.error('Upload error:', error);
        return new Response(
          JSON.stringify({
            success: false,
            message:
              error instanceof Error
                ? error.message
                : 'Failed to upload and process PDF',
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

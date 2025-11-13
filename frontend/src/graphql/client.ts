import { Client, cacheExchange, fetchExchange } from 'urql';

// GraphQL 端点 URL
const GRAPHQL_ENDPOINT =
  import.meta.env.VITE_GRAPHQL_ENDPOINT ||
  (window.location.origin.includes('localhost')
    ? 'http://localhost:8787/graphql'
    : `${window.location.origin.replace('interview.', 'api.')}/graphql`);

console.log('GraphQL Endpoint:', import.meta.env.VITE_GRAPHQL_ENDPOINT);

// 创建 urql 客户端
export const client = new Client({
  url: GRAPHQL_ENDPOINT,
  exchanges: [cacheExchange, fetchExchange],
  // 为 GraphQL 查询设置正确的 Content-Type
  fetchOptions: () => ({
    headers: {
      'Content-Type': 'application/json',
    },
  }),
});

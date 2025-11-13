import { createYoga } from 'graphql-yoga';
import { schema } from './schema';
import { Env, GraphQLContext } from './types';

// 创建 GraphQL Yoga 服务器
export function createGraphQLServer(env: Env) {
  return createYoga({
    schema,
    graphiql: true, // 启用 GraphiQL
    landingPage: false,
    context: (): GraphQLContext => ({
      env,
    }),
    cors: {
      origin: '*',
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
      methods: ['GET', 'POST', 'OPTIONS'],
    },
  });
}

export async function handleGraphQLRequest(
  request: Request,
  env: Env
): Promise<Response> {
  const yoga = createGraphQLServer(env);
  return yoga.fetch(request);
}

import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLScalarType,
} from 'graphql';
import { chatResolver, uploadPDFResolver } from './resolvers';

// 自定义 Upload Scalar（用于 Cloudflare Workers）
const GraphQLUpload = new GraphQLScalarType({
  name: 'Upload',
  description: 'File upload scalar type',
  serialize: () => {
    throw new Error('Upload serialization is not supported');
  },
  parseValue: (value) => value,
  parseLiteral: () => {
    throw new Error('Upload literal parsing is not supported');
  },
});

// ChatResponse 类型
const ChatResponseType = new GraphQLObjectType({
  name: 'ChatResponse',
  fields: {
    reply: {
      type: GraphQLString,
      description: "The assistant's reply",
    },
  },
});

// UploadResult 类型
const UploadResultType = new GraphQLObjectType({
  name: 'UploadResult',
  fields: {
    success: {
      type: GraphQLBoolean,
      description: 'Whether the upload was successful',
    },
    message: {
      type: GraphQLString,
      description: 'Status message',
    },
  },
});

// Query 类型
const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    chat: {
      type: ChatResponseType,
      args: {
        message: {
          type: GraphQLString,
          description: "The user's message",
        },
      },
      resolve: chatResolver,
    },
  },
});

// Mutation 类型
const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    uploadPDF: {
      type: UploadResultType,
      args: {
        file: {
          type: GraphQLUpload,
          description: 'The PDF file to upload',
        },
      },
      resolve: uploadPDFResolver,
    },
  },
});

// 创建 GraphQL Schema
export const schema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
});

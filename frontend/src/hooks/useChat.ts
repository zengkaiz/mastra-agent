// Chat Hook - 实际实现在 Chat 组件中使用 useQuery
// 这个文件保留作为类型定义和未来可能的扩展
export interface UseChatResult {
  sendMessage: (message: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

// GraphQL 类型定义

export interface ChatResponse {
  reply: string;
}

export interface UploadResult {
  success: boolean;
  message?: string;
}

export interface ChatVariables {
  message: string;
}

export interface UploadPDFVariables {
  file: File;
}

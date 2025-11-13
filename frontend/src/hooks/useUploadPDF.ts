import { useState } from 'react';
import { UploadResult } from '../graphql/types';

export interface UseUploadPDFResult {
  uploadPDF: (file: File) => Promise<UploadResult | null>;
  loading: boolean;
  error: Error | null;
}

// 获取上传端点 URL
const getUploadEndpoint = () => {
  const graphqlEndpoint =
    import.meta.env.VITE_GRAPHQL_ENDPOINT ||
    (window.location.origin.includes('localhost')
      ? 'http://localhost:8787/graphql'
      : `${window.location.origin.replace('interview.', 'api.')}/graphql`);

  // 将 /graphql 替换为 /upload-pdf
  return graphqlEndpoint.replace('/graphql', '/upload-pdf');
};

export const useUploadPDF = (): UseUploadPDFResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadPDF = async (file: File): Promise<UploadResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(getUploadEndpoint(), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      const err = error instanceof Error ? error : new Error('Upload failed');
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    uploadPDF,
    loading,
    error,
  };
};

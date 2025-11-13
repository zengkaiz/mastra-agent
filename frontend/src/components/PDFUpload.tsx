import React, { useState, useCallback } from 'react';
import { useUploadPDF } from '../hooks/useUploadPDF';
import { motion } from 'framer-motion';

interface PDFUploadProps {
  className?: string;
  onUploadSuccess?: () => void;
}

export const PDFUpload: React.FC<PDFUploadProps> = ({ className = '', onUploadSuccess }) => {
  const { uploadPDF, loading, error } = useUploadPDF();
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setUploadStatus({
          type: 'error',
          message: '只支持 PDF 文件',
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setUploadStatus({
          type: 'error',
          message: '文件大小不能超过 10MB',
        });
        return;
      }

      try {
        const result = await uploadPDF(file);
        if (result?.success) {
          setUploadStatus({
            type: 'success',
            message: result.message || 'PDF 上传成功！',
          });
          onUploadSuccess?.();
          // 3秒后清除状态
          setTimeout(() => {
            setUploadStatus({ type: null, message: '' });
          }, 3000);
        } else {
          setUploadStatus({
            type: 'error',
            message: result?.message || '上传失败',
          });
        }
      } catch (err) {
        setUploadStatus({
          type: 'error',
          message: err instanceof Error ? err.message : '上传失败',
        });
      }
    },
    [uploadPDF, onUploadSuccess]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-smooth ${
          dragActive
            ? 'border-primary-green bg-primary-green-light/10'
            : 'border-border-light bg-white hover:border-primary-green'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleChange}
          className="hidden"
          id="pdf-upload"
          disabled={loading}
        />
        <label
          htmlFor="pdf-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <motion.div
            animate={dragActive ? { scale: 1.1 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
            className="text-4xl sm:text-5xl mb-4"
          >
            📄
          </motion.div>
          <p className="text-base sm:text-lg font-medium text-text-primary mb-2">
            {loading ? '上传中...' : '上传简历或面试经验 PDF'}
          </p>
          <p className="text-sm text-text-secondary mb-4">
            拖拽文件到此处，或点击选择文件
          </p>
          <button
            type="button"
            disabled={loading}
            className="btn-primary-green px-6 py-2"
          >
            {loading ? '处理中...' : '选择文件'}
          </button>
        </label>

        {/* 状态提示 */}
        {uploadStatus.type && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-4 p-3 sm:p-4 rounded-xl ${
              uploadStatus.type === 'success'
                ? 'bg-primary-green-light/20 text-primary-green-dark'
                : 'bg-red-100 text-red-800'
            }`}
          >
            <p className="text-sm">{uploadStatus.message}</p>
          </motion.div>
        )}

        {/* 错误提示 */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-3 sm:p-4 bg-red-100 text-red-800 rounded-xl"
          >
            <p className="text-sm">{error.message}</p>
          </motion.div>
        )}
      </motion.div>

      <div className="mt-4 text-xs text-text-muted text-center px-4">
        <p>支持格式：PDF | 最大大小：10MB</p>
        <p className="mt-1">上传的 PDF 将被解析并添加到知识库中</p>
      </div>
    </div>
  );
};


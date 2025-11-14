import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PDFUpload } from './PDFUpload';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <div className="h-screen bg-background-light flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-border-light shadow-soft z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-xl sm:text-2xl font-bold text-text-primary"
              >
                英语面试助手
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="text-xs sm:text-sm text-text-secondary mt-1"
              >
                智能面试准备助手，帮助您准备英文技术面试
              </motion.p>
            </div>

            {/* 上传按钮 */}
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              onClick={() => setShowUploadModal(true)}
              className="btn-primary-green flex items-center gap-2 px-4 py-2 whitespace-nowrap"
            >
              <span className="text-lg">📄</span>
              <span className="hidden sm:inline">上传简历</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border-light">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 text-center text-sm text-text-secondary">
          <p>Powered by Mastra & Cloudflare</p>
        </div>
      </footer>

      {/* 上传模态框 */}
      <AnimatePresence>
        {showUploadModal && (
          <>
            {/* 背景遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
            />

            {/* 模态框内容 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setShowUploadModal(false)}
            >
              <div
                className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  {/* 模态框头部 */}
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                      上传简历或面试经验
                    </h2>
                    <button
                      onClick={() => setShowUploadModal(false)}
                      className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                    >
                      ×
                    </button>
                  </div>

                  <p className="text-gray-600 mb-6 text-sm">
                    上传您的 PDF 简历或面试经验文档，系统会自动解析并添加到知识库中。
                    这样在聊天时，助手就能根据您的实际经历提供个性化的面试建议。
                  </p>

                  {/* 上传组件 */}
                  <PDFUpload
                    onUploadSuccess={() => {
                      setTimeout(() => setShowUploadModal(false), 2000);
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};


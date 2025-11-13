import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from 'urql';
import { CHAT_QUERY } from '../graphql/queries';
import { ChatResponse } from '../graphql/types';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatProps {
  className?: string;
}

export const Chat: React.FC<ChatProps> = ({ className = '' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentQuery, setCurrentQuery] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // GraphQL Query - 使用 pause 控制何时执行查询
  const [result] = useQuery<{ chat: ChatResponse }>({
    query: CHAT_QUERY,
    variables: { message: currentQuery || '' },
    pause: !currentQuery,
  });

  // 处理查询结果
  useEffect(() => {
    if (result.data && currentQuery) {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: result.data.chat.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setCurrentQuery(null);
    }
  }, [result.data, currentQuery]);

  // 处理错误
  useEffect(() => {
    if (result.error && currentQuery) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '抱歉，发生了错误。请稍后重试。',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setCurrentQuery(null);
    }
  }, [result.error, currentQuery]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || result.fetching) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setCurrentQuery(inputValue.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-text-secondary mt-8 px-4">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-base sm:text-lg mb-2"
            >
              👋 欢迎使用面试辅导助手
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm"
            >
              输入您的问题，我会帮您准备英文面试回答
            </motion.p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
                    message.role === 'user'
                      ? 'bg-primary-orange text-white'
                      : 'bg-white border border-border-light text-text-primary'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm sm:text-base">{message.content}</p>
                  <p
                    className={`text-xs mt-1.5 ${
                      message.role === 'user' ? 'text-primary-orange-light' : 'text-text-muted'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        {result.fetching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-border-light rounded-2xl px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce-subtle" />
                <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce-subtle" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce-subtle" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="border-t border-border-light p-3 sm:p-4 bg-white">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入您的问题（支持中文）..."
            className="input-base flex-1 resize-none"
            rows={2}
            disabled={result.fetching}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || result.fetching}
            className="btn-primary-orange whitespace-nowrap sm:w-auto w-full"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};


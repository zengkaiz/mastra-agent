import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`card-base p-4 sm:p-6 ${onClick ? 'cursor-pointer card-hover' : ''} ${className}`}
      onClick={onClick}
      whileHover={onClick ? { y: -2 } : {}}
      whileTap={onClick ? { y: 0 } : {}}
    >
      {children}
    </motion.div>
  );
};


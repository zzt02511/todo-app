'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { RotateCcw, X } from 'lucide-react';

interface SnackbarProps {
  show: boolean;
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export function Snackbar({ show, message, onUndo, onDismiss }: SnackbarProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            'fixed bottom-24 left-1/2 -translate-x-1/2 z-50',
            'flex items-center gap-3 px-4 py-3',
            'bg-[var(--card-bg)] border border-[var(--border-color)]',
            'rounded-2xl shadow-lg backdrop-blur-xl'
          )}
        >
          <span className="text-sm text-[var(--text-primary)]">
            {message}
          </span>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onUndo}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>撤销</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onDismiss}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

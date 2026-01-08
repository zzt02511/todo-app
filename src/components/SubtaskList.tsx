'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Subtask } from '@/lib/types';
import { Plus, Check, Trash2, X } from 'lucide-react';
import { saveSubtask, deleteSubtask } from '@/lib/supabase';

interface SubtaskListProps {
  todoId: string;
  subtasks: Subtask[];
  onSubtasksChange: (subtasks: Subtask[]) => void;
  completed: boolean;
}

export function SubtaskList({ todoId, subtasks, onSubtasksChange, completed }: SubtaskListProps) {
  const [newSubtask, setNewSubtask] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSubtask = async () => {
    if (newSubtask.trim()) {
      const newSubtaskItem: Subtask = {
        id: crypto.randomUUID(),
        todoId,
        content: newSubtask.trim(),
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await saveSubtask(newSubtaskItem);
      onSubtasksChange([...subtasks, newSubtaskItem]);
      setNewSubtask('');
      setIsAdding(false);
    }
  };

  const handleToggleSubtask = async (id: string) => {
    const updated = subtasks.map(st =>
      st.id === id ? { ...st, completed: !st.completed, updatedAt: new Date() } : st
    );
    const toggled = updated.find(st => st.id === id);
    if (toggled) {
      await saveSubtask(toggled);
    }
    onSubtasksChange(updated);
  };

  const handleDeleteSubtask = async (id: string) => {
    await deleteSubtask(id);
    onSubtasksChange(subtasks.filter(st => st.id !== id));
  };

  const completedCount = subtasks.filter(st => st.completed).length;
  const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="ml-9 mt-2 space-y-2"
    >
      {/* Progress bar */}
      {subtasks.length > 0 && (
        <div className="h-1 bg-[var(--border-color)] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={cn(
              'h-full transition-colors',
              completed ? 'bg-green-500' : 'bg-blue-500'
            )}
          />
        </div>
      )}

      {/* Subtask list */}
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {subtasks.map((subtask) => (
            <motion.div
              key={subtask.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className={cn(
                'flex items-center gap-2 px-2 py-1 rounded-lg transition-colors',
                subtask.completed
                  ? 'bg-[var(--card-hover)]/50'
                  : 'hover:bg-[var(--card-hover)]'
              )}
            >
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => handleToggleSubtask(subtask.id)}
                className={cn(
                  'flex-shrink-0 w-4 h-4 rounded-full border-2 transition-all',
                  subtask.completed
                    ? 'bg-green-500 border-green-500'
                    : 'border-[var(--border-color)] hover:border-green-400'
                )}
              >
                {subtask.completed && (
                  <Check className="w-2.5 h-2.5 text-white mx-auto" strokeWidth={3} />
                )}
              </motion.button>

              <span className={cn(
                'flex-1 text-sm break-all transition-all',
                subtask.completed
                  ? 'text-[var(--text-muted)] line-through'
                  : 'text-[var(--text-secondary)]'
              )}>
                {subtask.content}
              </span>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDeleteSubtask(subtask.id)}
                className="p-1 text-[var(--text-muted)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add subtask */}
      {isAdding ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddSubtask();
              if (e.key === 'Escape') setIsAdding(false);
            }}
            autoFocus
            placeholder="输入子任务..."
            className="flex-1 px-2 py-1 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg focus:border-green-500 focus:outline-none text-[var(--text-primary)]"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleAddSubtask}
            disabled={!newSubtask.trim()}
            className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setIsAdding(false);
              setNewSubtask('');
            }}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </motion.div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 px-2 py-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>添加子任务</span>
        </motion.button>
      )}
    </motion.div>
  );
}

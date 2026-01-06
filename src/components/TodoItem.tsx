'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Todo } from '@/lib/types';
import { Check, Trash2, Edit2, Save, X, Calendar } from 'lucide-react';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string, dueDate: string | null) => void;
}

export function TodoItem({ todo, onToggle, onDelete, onUpdate }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(todo.content);
  const [editDate, setEditDate] = useState(todo.dueDate || '');

  const handleSave = () => {
    if (editContent.trim()) {
      onUpdate(todo.id, editContent.trim(), editDate || null);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditContent(todo.content);
      setEditDate(todo.dueDate || '');
      setIsEditing(false);
    }
  };

  const isOverdue = todo.dueDate && !todo.completed && new Date(todo.dueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          'group flex items-start gap-3 px-4 py-3 hover:bg-gray-50/80',
          'transition-colors duration-200',
          todo.completed && 'bg-gray-50/50'
        )}
      >
        {/* Checkbox */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => onToggle(todo.id)}
          className={cn(
            'flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 transition-all duration-300',
            todo.completed
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 hover:border-gray-400'
          )}
        >
          <AnimatePresence>
            {todo.completed && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Check className="w-3 h-3 text-white mx-auto" strokeWidth={3} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="w-full px-3 py-2 text-gray-800 bg-white border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                placeholder="待办事项..."
              />
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="px-2 py-1 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                />
                {editDate && (
                  <button
                    onClick={() => setEditDate('')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 text-sm text-white bg-green-500 hover:bg-green-600 rounded-lg"
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setEditContent(todo.content);
                    setEditDate(todo.dueDate || '');
                    setIsEditing(false);
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  取消
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p
                className={cn(
                  'text-gray-800 break-words transition-all duration-200',
                  todo.completed && 'text-gray-400 line-through decoration-2 decoration-gray-300'
                )}
              >
                {todo.content}
              </p>
              {todo.dueDate && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    'inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs rounded-full',
                    isOverdue
                      ? 'bg-red-100 text-red-600'
                      : 'bg-blue-100 text-blue-600'
                  )}
                >
                  <Calendar className="w-3 h-3" />
                  {todo.dueDate}
                </motion.div>
              )}
            </motion.div>
          )}
        </div>

        {/* Actions */}
        <AnimatePresence>
          {!isEditing && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 0, x: 0 }}
              whileHover={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDelete(todo.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

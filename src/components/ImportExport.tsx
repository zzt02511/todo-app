'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ImportData, Todo } from '@/lib/types';
import { Download, Upload, FileJson, Check, AlertCircle, X } from 'lucide-react';
import { saveTodo, fetchTodos } from '@/lib/supabase';

interface ImportExportProps {
  onImportComplete: () => void;
}

export function ImportExport({ onImportComplete }: ImportExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportToJSON = async () => {
    setIsExporting(true);
    try {
      const todos = await fetchTodos();

      const exportData: ImportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        todos: todos.map(t => ({
          content: t.content,
          completed: t.completed,
          dueDate: t.dueDate,
          priority: t.priority,
          category: t.category,
          repeatType: t.repeatType,
          repeatEndDate: t.repeatEndDate,
        })),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus('idle');

    try {
      const text = await file.text();
      const data = JSON.parse(text) as ImportData;

      // 验证数据格式
      if (!data.version || !Array.isArray(data.todos)) {
        throw new Error('无效的文件格式');
      }

      // 导入每个待办事项
      let importedCount = 0;
      const now = new Date();

      for (const todoData of data.todos) {
        if (!todoData.content) continue;

        const todo: Todo = {
          id: crypto.randomUUID(),
          content: todoData.content,
          completed: todoData.completed || false,
          dueDate: todoData.dueDate || null,
          priority: todoData.priority || 'medium',
          category: todoData.category || 'other',
          repeatType: todoData.repeatType || null,
          repeatEndDate: todoData.repeatEndDate || null,
          completedAt: todoData.completed ? now : null,
          sortOrder: 0,
          isArchived: false,
          subtasks: [],
          createdAt: now,
          updatedAt: now,
        };

        await saveTodo(todo);
        importedCount++;
      }

      setImportStatus('success');
      setImportMessage(`成功导入 ${importedCount} 个待办事项`);

      setTimeout(() => {
        onImportComplete();
      }, 1500);
    } catch (error) {
      setImportStatus('error');
      setImportMessage(error instanceof Error ? error.message : '导入失败');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Import Status */}
      <AnimatePresence>
        {importStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-xl',
              importStatus === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
            )}
          >
            {importStatus === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="flex-1 text-sm">{importMessage}</span>
            <button
              onClick={() => setImportStatus('idle')}
              className="p-1 hover:bg-white/50 dark:hover:bg-white/10 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={exportToJSON}
          disabled={isExporting}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-3',
            'bg-[var(--card-hover)] hover:bg-[var(--border-color)]',
            'text-[var(--text-primary)] rounded-xl transition-colors',
            isExporting && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Download className="w-5 h-5" />
          <span>导出 JSON</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-3',
            'bg-[var(--card-hover)] hover:bg-[var(--border-color)]',
            'text-[var(--text-primary)] rounded-xl transition-colors',
            isImporting && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Upload className="w-5 h-5" />
          <span>导入 JSON</span>
        </motion.button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Format Info */}
      <div className="flex items-start gap-2 p-3 bg-[var(--card-hover)] rounded-xl">
        <FileJson className="w-5 h-5 text-[var(--text-muted)] mt-0.5" />
        <div className="text-xs text-[var(--text-secondary)]">
          <p className="font-medium text-[var(--text-primary)] mb-1">支持的格式</p>
          <p>JSON 文件，包含 todos 数组。每条记录包含 content、completed、dueDate 等字段。</p>
        </div>
      </div>
    </div>
  );
}

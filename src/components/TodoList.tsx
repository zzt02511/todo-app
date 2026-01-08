'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useAutoAnimate } from '@formkit/auto-animate/react';

import { cn, formatDate } from '@/lib/utils';
import { Todo, FilterType } from '@/lib/types';
import { TodoItem } from './TodoItem';
import { SettingsModal } from './SettingsModal';
import { Snackbar } from './Snackbar';
import { StatsPanel } from './StatsPanel';
import { Plus, Search, ListTodo, Trash2, Calendar, X, Database, Sun, Moon, BarChart3 } from 'lucide-react';
import {
  isSupabaseConfigured,
  fetchTodos,
  saveTodo,
  deleteTodoById,
  deleteTodosByIds,
  saveDeletedTodo,
  fetchLatestDeletedTodo,
  deleteDeletedTodo,
  restoreTodo,
  updateTodoOrder,
} from '@/lib/supabase';
import { useTheme } from '@/lib/hooks/useTheme';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';

export function TodoList() {
  const { theme, mounted, toggleTheme } = useTheme();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [newTodoDate, setNewTodoDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [parent] = useAutoAnimate();

  // 撤销相关状态
  const [showUndoSnackbar, setShowUndoSnackbar] = useState(false);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);

  // 启动时加载数据
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const data = await fetchTodos();
      setTodos(data);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // 检查 Supabase 连接状态
  useEffect(() => {
    setSupabaseConnected(isSupabaseConfigured());
  }, []);

  const filteredTodos = todos
    .filter((todo) => {
      if (filter === 'active') return !todo.completed;
      if (filter === 'completed') return todo.completed;
      return true;
    })
    .filter((todo) =>
      todo.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const activeCount = todos.filter((todo) => !todo.completed).length;
  const completedCount = todos.filter((todo) => todo.completed).length;

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      const now = new Date();
      const todo: Todo = {
        id: crypto.randomUUID(),
        content: newTodo.trim(),
        completed: false,
        dueDate: newTodoDate || null,
        priority: 'medium',
        category: 'other',
        repeatType: null,
        repeatEndDate: null,
        completedAt: null,
        sortOrder: 0,
        isArchived: false,
        subtasks: [],
        createdAt: now,
        updatedAt: now,
      };

      // 保存到 Supabase
      await saveTodo(todo);
      setTodos(prev => [todo, ...prev]);

      setNewTodo('');
      setNewTodoDate(new Date().toISOString().split('T')[0]);
      setShowDatePicker(false);
    }
  };

  const toggleTodo = async (id: string) => {
    const now = new Date();
    const updatedTodo = todos.find(todo => todo.id === id);
    if (!updatedTodo) return;

    const isCompleting = !updatedTodo.completed;
    const updated = {
      ...updatedTodo,
      completed: isCompleting,
      completedAt: isCompleting ? now : null,
      updatedAt: now,
    };

    // 更新 Supabase
    await saveTodo(updated);
    setTodos(prev => prev.map(todo => todo.id === id ? updated : todo));
  };

  const deleteTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    // 保存到 deleted_todos 表（用于撤销）
    await saveDeletedTodo(todo);

    // 从主表删除
    await deleteTodoById(id);
    setTodos(prev => prev.filter(todo => todo.id !== id));

    // 显示撤销提示
    setShowUndoSnackbar(true);

    // 设置30秒后自动清除撤销提示
    if (undoTimeout) clearTimeout(undoTimeout);
    const timeout = setTimeout(() => {
      setShowUndoSnackbar(false);
    }, 30000);
    setUndoTimeout(timeout);
  };

  // 撤销删除
  const handleUndo = async () => {
    const deleted = await fetchLatestDeletedTodo();
    if (deleted) {
      await restoreTodo(deleted);
      await deleteDeletedTodo(deleted.id);
      // 重新加载数据
      const data = await fetchTodos();
      setTodos(data);
    }
    setShowUndoSnackbar(false);
    if (undoTimeout) {
      clearTimeout(undoTimeout);
      setUndoTimeout(null);
    }
  };

  // 关闭撤销提示（不清除数据）
  const dismissUndo = () => {
    setShowUndoSnackbar(false);
    if (undoTimeout) {
      clearTimeout(undoTimeout);
      setUndoTimeout(null);
    }
  };

  // 键盘快捷键
  useKeyboardShortcuts([
    {
      action: 'n',
      description: '新建待办',
      handler: () => document.getElementById('new-todo-input')?.focus(),
    },
    {
      action: '/',
      description: '聚焦搜索',
      handler: () => document.getElementById('search-input')?.focus(),
    },
    {
      action: '1',
      description: '显示全部',
      handler: () => setFilter('all'),
    },
    {
      action: '2',
      description: '显示进行中',
      handler: () => setFilter('active'),
    },
    {
      action: '3',
      description: '显示已完成',
      handler: () => setFilter('completed'),
    },
    {
      action: 'mod+z',
      description: '撤销删除',
      handler: () => {
        if (showUndoSnackbar) handleUndo();
      },
    },
    {
      action: 'mod+d',
      description: '切换主题',
      handler: toggleTheme,
    },
    {
      action: 'Escape',
      description: '关闭弹窗',
      handler: () => {
        if (showSettings) setShowSettings(false);
        if (showStats) setShowStats(false);
        setShowDatePicker(false);
      },
    },
  ]);

  const updateTodo = async (
    id: string,
    content: string,
    dueDate: string | null,
    priority?: Todo['priority'],
    category?: Todo['category']
  ) => {
    const now = new Date();
    const updatedTodo = todos.find(todo => todo.id === id);
    if (!updatedTodo) return;

    const updated = {
      ...updatedTodo,
      content,
      dueDate,
      priority: priority ?? updatedTodo.priority,
      category: category ?? updatedTodo.category,
      updatedAt: now,
    };

    // 更新 Supabase
    await saveTodo(updated);
    setTodos(prev => prev.map(todo => todo.id === id ? updated : todo));
  };

  const clearCompleted = async () => {
    const completedIds = todos.filter((todo) => todo.completed).map(t => t.id);

    // 从 Supabase 批量删除
    await deleteTodosByIds(completedIds);
    setTodos(prev => prev.filter(todo => !todo.completed));
  };

  // 配置更改后重新加载数据
  const handleConfigChange = async () => {
    setSupabaseConnected(isSupabaseConfigured());
    const data = await fetchTodos();
    setTodos(data);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors duration-300">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-[var(--card-bg)]/80 backdrop-blur-xl border-b border-[var(--border-color)] transition-colors duration-300"
      >
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center"
              >
                <ListTodo className="w-5 h-5 text-white" />
              </motion.div>
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">待办事项</h1>
            </div>
            <div className="flex items-center gap-3">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-[var(--text-secondary)]"
              >
                {formatDate(new Date())}
              </motion.span>

              {/* Stats Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowStats(!showStats)}
                className={cn(
                  'p-2 rounded-xl transition-colors',
                  showStats
                    ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--card-hover)]'
                )}
                title="统计面板"
              >
                <BarChart3 className="w-5 h-5" />
              </motion.button>

              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--card-hover)] transition-colors"
                title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
              >
                {mounted && theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </motion.button>

              {/* Settings */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSettings(true)}
                className={cn(
                  'p-2 rounded-xl transition-colors',
                  supabaseConnected
                    ? 'text-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--card-hover)]'
                )}
                title={supabaseConnected ? '已连接 Supabase' : '数据存储设置'}
              >
                <Database className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Stats Panel */}
          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <StatsPanel todos={todos} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索... (按 / 聚焦)"
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--card-hover)] hover:bg-[var(--border-color)] rounded-xl
                         text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]
                         focus:outline-none focus:ring-2 focus:ring-green-500/20
                         transition-all duration-200"
            />
          </div>

          {/* Add Todo */}
          <form onSubmit={addTodo}>
            <motion.div

              className="relative"
            >
              <input
                id="new-todo-input"
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="添加新事项... (按 n 聚焦)"
                className="w-full px-4 py-3 pr-32 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl
                           text-[var(--text-primary)] placeholder-[var(--text-muted)]
                           focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500
                           shadow-sm hover:shadow-md
                           transition-all duration-200"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={cn(
                    'p-2 rounded-xl transition-colors',
                    showDatePicker || newTodoDate
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-500'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--card-hover)]'
                  )}
                >
                  <Calendar className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="submit"
                  disabled={!newTodo.trim()}
                  className="p-2 bg-green-500 hover:bg-green-600 disabled:bg-[var(--border-color)]
                             text-white rounded-xl transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Date Picker Dropdown */}
              <AnimatePresence>
                {showDatePicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 p-4 w-64 bg-[var(--card-bg)] rounded-2xl shadow-lg border border-[var(--border-color)] z-20"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-[var(--text-primary)]">设置截止日期</span>
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(false)}
                        className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="date"
                      value={newTodoDate}
                      onChange={(e) => setNewTodoDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 text-[var(--text-primary)] bg-[var(--card-hover)] border border-[var(--border-color)] rounded-lg
                                 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    />
                    <div className="flex justify-end mt-3">
                      <button
                        type="button"
                        onClick={() => setNewTodoDate(new Date().toISOString().split('T')[0])}
                        className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        回到今天
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </form>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mt-4">
            {(['all', 'active', 'completed'] as FilterType[]).map((f) => (
              <motion.button
                key={f}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200',
                  filter === f
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
                )}
              >
                {f === 'all' ? '全部' : f === 'active' ? '进行中' : '已完成'}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.header>

      {/* Todo List */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-gray-400"
            >
              <div className="w-8 h-8 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin mb-4" />
              <p className="text-sm">加载中...</p>
            </motion.div>
          ) : filteredTodos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-gray-400"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              >
                <ListTodo className="w-16 h-16 mb-4 opacity-50" />
              </motion.div>
              <p className="text-lg font-medium">
                {todos.length === 0 ? '暂无待办事项' : '没有找到匹配的事项'}
              </p>
              <p className="text-sm mt-1">
                {todos.length === 0 ? '添加一个新事项开始吧！' : '试试其他搜索词'}
              </p>
            </motion.div>
          ) : (
            <Reorder.Group
              ref={parent}
              axis="y"
              values={filteredTodos}
              onReorder={() => {}}
              className="space-y-2"
            >
              {filteredTodos.map((todo) => (
                <Reorder.Item
                  key={todo.id}
                  value={todo}
                  layoutId={todo.id}
                >
                  <TodoItem
                    todo={todo}
                    onToggle={toggleTodo}
                    onDelete={deleteTodo}
                    onUpdate={updateTodo}
                  />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Stats */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-[var(--card-bg)]/80 backdrop-blur-xl border-t border-[var(--border-color)] transition-colors duration-300"
      >
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-[var(--text-secondary)]">
                <span className="font-medium text-[var(--text-primary)]">{activeCount}</span> 项未完成
              </span>
              <span className="text-[var(--text-muted)]">|</span>
              <span className="text-[var(--text-secondary)]">
                <span className="font-medium text-[var(--text-primary)]">{completedCount}</span> 项已完成
              </span>
            </div>
            {completedCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearCompleted}
                className="flex items-center gap-1.5 px-3 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>清除已完成</span>
              </motion.button>
            )}
          </div>
        </div>
      </motion.footer>

      {/* Bottom Padding */}
      <div className="h-24" />

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
            onConfigChange={handleConfigChange}
          />
        )}
      </AnimatePresence>

      {/* Undo Snackbar */}
      <Snackbar
        show={showUndoSnackbar}
        message="已删除待办事项"
        onUndo={handleUndo}
        onDismiss={dismissUndo}
      />


      {/* Bottom Padding */}
      <div className="h-28" />
    </div>
  );
}
/* force rebuild */

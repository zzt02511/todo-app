'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useAutoAnimate } from '@formkit/auto-animate/react';

import { cn, formatDate } from '@/lib/utils';
import { Todo, FilterType } from '@/lib/types';
import { TodoItem } from './TodoItem';
import { Settings } from './Settings';
import { Plus, Search, ListTodo, Trash2, Calendar, X, Database } from 'lucide-react';
import { isSupabaseConfigured, fetchTodos, saveTodo, deleteTodoById, deleteTodosByIds } from '@/lib/supabase';

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [newTodoDate, setNewTodoDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [parent] = useAutoAnimate();

  // 启动时从 Supabase 加载数据
  useEffect(() => {
    const loadTodos = async () => {
      setIsLoading(true);
      const data = await fetchTodos();
      setTodos(data);
      setIsLoading(false);
    };
    loadTodos();
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

    const updated = { ...updatedTodo, completed: !updatedTodo.completed, updatedAt: now };

    // 更新 Supabase
    await saveTodo(updated);
    setTodos(prev => prev.map(todo => todo.id === id ? updated : todo));
  };

  const deleteTodo = async (id: string) => {
    // 从 Supabase 删除
    await deleteTodoById(id);
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const updateTodo = async (id: string, content: string, dueDate: string | null) => {
    const now = new Date();
    const updatedTodo = todos.find(todo => todo.id === id);
    if (!updatedTodo) return;

    const updated = { ...updatedTodo, content, dueDate, updatedAt: now };

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
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-100"
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
              <h1 className="text-xl font-semibold text-gray-900">待办事项</h1>
            </div>
            <div className="flex items-center gap-3">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-500"
              >
                {formatDate(new Date())}
              </motion.span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSettings(true)}
                className={cn(
                  'p-2 rounded-xl transition-colors',
                  supabaseConnected
                    ? 'text-green-500 bg-green-50'
                    : 'text-gray-400 hover:bg-gray-100'
                )}
                title={supabaseConnected ? '已连接 Supabase' : '数据存储设置'}
              >
                <Database className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 hover:bg-gray-200/80 rounded-xl
                         text-sm text-gray-800 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-green-500/20
                         transition-all duration-200"
            />
          </div>

          {/* Add Todo */}
          <form onSubmit={addTodo}>
            <motion.div
              whileFocusWithin={{ scale: 1.02 }}
              className="relative"
            >
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="添加新事项..."
                className="w-full px-4 py-3 pr-32 bg-white border border-gray-200 rounded-2xl
                           text-gray-800 placeholder-gray-400
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
                      ? 'bg-blue-100 text-blue-500'
                      : 'text-gray-400 hover:bg-gray-100'
                  )}
                >
                  <Calendar className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="submit"
                  disabled={!newTodo.trim()}
                  className="p-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-200
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
                    className="absolute right-0 top-full mt-2 p-4 w-64 bg-white rounded-2xl shadow-lg border border-gray-100 z-20"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">设置截止日期</span>
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="date"
                      value={newTodoDate}
                      onChange={(e) => setNewTodoDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg
                                 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    />
                    <div className="flex justify-end mt-3">
                      <button
                        type="button"
                        onClick={() => setNewTodoDate(new Date().toISOString().split('T')[0])}
                        className="text-sm text-gray-500 hover:text-gray-700"
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
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
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
        className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100"
      >
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-gray-500">
                <span className="font-medium text-gray-900">{activeCount}</span> 项未完成
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">
                <span className="font-medium text-gray-900">{completedCount}</span> 项已完成
              </span>
            </div>
            {completedCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearCompleted}
                className="flex items-center gap-1.5 px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
          <Settings
            onClose={() => setShowSettings(false)}
            onConfigChange={handleConfigChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

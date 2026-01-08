'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon, X, Check, Database, AlertCircle, Download, Upload, Keyboard } from 'lucide-react';
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
  isSupabaseConfigured,
  getSupabaseClient,
  clearSupabaseConfig,
  fetchTodos,
} from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { ImportExport } from './ImportExport';
import { keyboardShortcutDescriptions } from '@/lib/hooks/useKeyboardShortcuts';

type TabType = 'storage' | 'import' | 'shortcuts';

interface SettingsModalProps {
  onClose: () => void;
  onConfigChange: () => void;
}

export function SettingsModal({ onClose, onConfigChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('storage');
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const url = getSupabaseUrl();
    const key = getSupabaseAnonKey();

    if (url && key) {
      setUrl(url);
      setAnonKey(key);
      setIsConnected(true);
    } else {
      setIsConnected(false);
    }
  }, []);

  const handleTestConnection = async () => {
    setIsChecking(true);
    setError('');
    setSuccess(false);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError('无法连接数据库');
        return;
      }
      const { error: err } = await supabase.from('todos').select('id').limit(1);
      if (err) {
        setError(`连接失败: ${err.message}`);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError('连接异常');
    } finally {
      setIsChecking(false);
    }
  };

  const handleClear = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setIsConnected(false);
    onConfigChange();
  };

  const handleImportComplete = () => {
    onConfigChange();
  };

  const tabs = [
    { id: 'storage' as TabType, label: '数据存储', icon: Database },
    { id: 'import' as TabType, label: '导入导出', icon: Download },
    { id: 'shortcuts' as TabType, label: '快捷键', icon: Keyboard },
  ] as const;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">设置</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[var(--border-color)]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'text-green-500 border-b-2 border-green-500'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Storage Tab */}
            {activeTab === 'storage' && (
              <div className="space-y-4">
                <div className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-xl text-sm',
                  isConnected
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                    : 'bg-[var(--card-hover)] text-[var(--text-secondary)]'
                )}>
                  <Database className="w-4 h-4" />
                  {isConnected ? '已连接数据库' : '未配置数据库'}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] mb-2">
                    <Database className="w-4 h-4" />
                    Supabase URL
                  </label>
                  <input
                    type="text"
                    value={url}
                    readOnly
                    className="w-full px-4 py-3 text-[var(--text-primary)] bg-[var(--card-hover)] border border-[var(--border-color)] rounded-xl
                               focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Anon Key
                  </label>
                  <input
                    type="password"
                    value={anonKey}
                    readOnly
                    className="w-full px-4 py-3 text-[var(--text-primary)] bg-[var(--card-hover)] border border-[var(--border-color)] rounded-xl
                               focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-blue-600 dark:text-blue-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>配置由服务器统一管理，所有用户自动连接。</p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-sm"
                  >
                    <Check className="w-4 h-4" />
                    连接成功！
                  </motion.div>
                )}
              </div>
            )}

            {/* Import/Export Tab */}
            {activeTab === 'import' && (
              <ImportExport onImportComplete={handleImportComplete} />
            )}

            {/* Shortcuts Tab */}
            {activeTab === 'shortcuts' && (
              <div className="space-y-3">
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  使用快捷键可以提高操作效率
                </p>
                <div className="space-y-2">
                  {keyboardShortcutDescriptions.map((shortcut) => (
                    <div
                      key={shortcut.key}
                      className="flex items-center justify-between p-2 bg-[var(--card-hover)] rounded-lg"
                    >
                      <span className="text-sm text-[var(--text-secondary)]">
                        {shortcut.description}
                      </span>
                      <kbd className="px-2 py-1 text-xs font-mono bg-[var(--border-color)] text-[var(--text-primary)] rounded">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {activeTab === 'storage' && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-color)] bg-[var(--card-hover)]">
              {isConnected && (
                <button
                  onClick={handleClear}
                  className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  断开连接
                </button>
              )}
              <button
                onClick={handleTestConnection}
                disabled={isChecking || !isConnected}
                className={cn(
                  'px-4 py-2 text-sm rounded-xl transition-all duration-200',
                  isChecking || !isConnected
                    ? 'bg-[var(--border-color)] text-[var(--text-muted)] cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                )}
              >
                {isChecking ? '测试中...' : '测试连接'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

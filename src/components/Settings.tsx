'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon, X, Check, Database, AlertCircle } from 'lucide-react';
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
  isSupabaseConfigured,
  getSupabaseClient,
  clearSupabaseConfig,
} from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface SettingsProps {
  onClose: () => void;
  onConfigChange: () => void;
}

export function Settings({ onClose, onConfigChange }: SettingsProps) {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // 打开时自动加载配置
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">数据存储设置</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Connection Status */}
            <div className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-xl text-sm',
              isConnected
                ? 'bg-green-50 text-green-600'
                : 'bg-gray-50 text-gray-500'
            )}>
              <Database className="w-4 h-4" />
              {isConnected ? '已连接数据库' : '未配置数据库'}
            </div>

            {/* URL Display */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Database className="w-4 h-4" />
                Supabase URL
              </label>
              <input
                type="text"
                value={url}
                readOnly
                className="w-full px-4 py-3 text-gray-800 bg-gray-50 border border-gray-200 rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* API Key Display */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                Anon Key
              </label>
              <input
                type="password"
                value={anonKey}
                readOnly
                className="w-full px-4 py-3 text-gray-800 bg-gray-50 border border-gray-200 rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Help Text */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl text-sm text-blue-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>
                配置由服务器统一管理，所有用户自动连接。
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-green-50 text-green-600 rounded-xl text-sm"
              >
                <Check className="w-4 h-4" />
                连接成功！
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
            {isConnected && (
              <button
                onClick={handleClear}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              )}
            >
              {isChecking ? '测试中...' : '测试连接'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

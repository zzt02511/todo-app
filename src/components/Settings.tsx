'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon, X, Check, Database, Key, AlertCircle } from 'lucide-react';
import {
  saveSupabaseConfig,
  clearSupabaseConfig,
  getSupabaseUrl,
  getSupabaseAnonKey,
  isSupabaseConfigured,
  getSupabaseClient,
  syncConfigToDatabase,
  fetchConfigFromDatabase,
  SupabaseConfig,
} from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';

interface SettingsProps {
  onClose: () => void;
  onConfigChange: () => void;
}

export function Settings({ onClose, onConfigChange }: SettingsProps) {
  const [url, setUrl] = useState(getSupabaseUrl());
  const [anonKey, setAnonKey] = useState(getSupabaseAnonKey());
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // 打开时尝试从数据库加载配置到输入框
  useEffect(() => {
    const initConfig = async () => {
      // 1. 先从 localStorage 读取
      const localUrl = getSupabaseUrl();
      const localKey = getSupabaseAnonKey();

      if (localUrl && localKey) {
        setUrl(localUrl);
        setAnonKey(localKey);
        setIsConnected(true);
        return;
      }

      // 2. localStorage 为空
      // 如果用户之前保存过配置在数据库里，可以在输入后点击"恢复配置"来加载
      setIsConnected(false);
    };
    initConfig();
  }, []);

  const handleSave = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setError('请填写完整的 Supabase 配置');
      return;
    }

    setIsChecking(true);
    setError('');

    try {
      // 先保存到 localStorage
      saveSupabaseConfig({ url: url.trim(), anonKey: anonKey.trim() });

      // 尝试同步到数据库（如果表存在）
      await syncConfigToDatabase();

      onConfigChange();
      setIsConnected(true);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError('保存失败，请检查配置是否正确');
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

  const handleTestConnection = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setError('请填写完整的 Supabase 配置');
      return;
    }

    setIsChecking(true);
    setError('');
    setSuccess(false);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError('无法创建 Supabase 客户端，请检查配置');
        return;
      }
      // 测试连接：尝试获取 todos 表
      const { data, error } = await supabase.from('todos').select('id').limit(1);
      if (error) {
        setError(`连接失败: ${error.message}`);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError('连接异常，请检查配置是否正确');
    } finally {
      setIsChecking(false);
    }
  };

  // 从数据库恢复已保存的配置
  const handleRestoreFromDatabase = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setError('请先填写 Supabase 配置来连接数据库');
      return;
    }

    setIsChecking(true);
    setError('');
    setSuccess(false);

    try {
      // 使用当前输入的配置创建临时客户端
      const tempClient = createClient(url.trim(), anonKey.trim());

      // 尝试从数据库读取已保存的配置
      const config = await fetchConfigFromDatabase(tempClient);

      if (config && config.url && config.anonKey) {
        // 找到已保存的配置，更新输入框并保存到 localStorage
        setUrl(config.url);
        setAnonKey(config.anonKey);
        saveSupabaseConfig(config);
        setIsConnected(true);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('数据库中未找到已保存的配置');
      }
    } catch (err) {
      setError('恢复配置失败，请检查数据库连接');
    } finally {
      setIsChecking(false);
    }
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
              {isConnected ? '已连接 Supabase' : '使用本地存储'}
            </div>

            {/* URL Input */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Database className="w-4 h-4" />
                Supabase URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xxxxx.supabase.co"
                className="w-full px-4 py-3 text-gray-800 bg-gray-50 border border-gray-200 rounded-xl
                           placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                           transition-all duration-200"
              />
            </div>

            {/* API Key Input */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Key className="w-4 h-4" />
                Anon Key
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-4 py-3 text-gray-800 bg-gray-50 border border-gray-200 rounded-xl
                           placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                           transition-all duration-200"
              />
            </div>

            {/* Help Text */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl text-sm text-blue-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>
                请在 Supabase 控制台创建 <code>todos</code> 表，
                包含 <code>id</code>、<code>content</code>、<code>completed</code>、<code>due_date</code> 字段。
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
                配置已恢复！
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
            {/* 未连接时显示恢复配置按钮 */}
            {!isConnected && (
              <button
                onClick={handleRestoreFromDatabase}
                disabled={isChecking || !url.trim() || !anonKey.trim()}
                className={cn(
                  'px-4 py-2 text-sm rounded-xl transition-all duration-200',
                  isChecking || !url.trim() || !anonKey.trim()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                )}
              >
                {isChecking ? '恢复中...' : '恢复数据库配置'}
              </button>
            )}
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
              disabled={isChecking || !url.trim() || !anonKey.trim()}
              className={cn(
                'px-4 py-2 text-sm rounded-xl transition-all duration-200',
                isChecking || !url.trim() || !anonKey.trim()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              )}
            >
              测试连接
            </button>
            <button
              onClick={handleSave}
              disabled={isChecking}
              className={cn(
                'px-6 py-2 text-sm text-white rounded-xl transition-all duration-200',
                isChecking
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              )}
            >
              {isChecking ? '保存中...' : '保存配置'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

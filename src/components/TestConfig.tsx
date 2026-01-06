'use client';
import { useEffect, useState } from 'react';
import { getSupabaseUrl, getSupabaseAnonKey, isSupabaseConfigured } from '@/lib/supabase';

export default function TestConfig() {
  const [hasConfig, setHasConfig] = useState(false);
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');

  useEffect(() => {
    setHasConfig(isSupabaseConfigured());
    setUrl(getSupabaseUrl());
    setKey(getSupabaseAnonKey());
  }, []);

  return (
    <div className="p-4 bg-yellow-50">
      <h3>配置状态检测</h3>
      <p>hasConfig: {hasConfig ? '✓ 有配置' : '✗ 无配置'}</p>
      <p>URL: {url || '(空)'}</p>
      <p>Key: {key ? '***' + key.slice(-10) : '(空)'}</p>
    </div>
  );
}

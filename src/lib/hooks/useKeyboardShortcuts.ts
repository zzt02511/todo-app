'use client';

import { useEffect, useCallback } from 'react';

interface ShortcutAction {
  action: string;
  description: string;
  handler: () => void;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  ignoreInput?: boolean;
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutAction[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, ignoreInput = true } = options;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // 如果在输入框中，忽略某些快捷键
    if (ignoreInput && (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
      // 但允许 Escape
      if (e.key !== 'Escape') return;
    }

    // 构建快捷键组合
    const keys: string[] = [];
    if (e.ctrlKey || e.metaKey) keys.push('mod');
    if (e.shiftKey) keys.push('shift');
    if (e.altKey) keys.push('alt');
    keys.push(e.key.toLowerCase());

    const shortcutKey = keys.join('+');

    // 查找匹配的快捷键
    const shortcut = shortcuts.find(s => {
      const sKeys = s.action.split('+');
      return sKeys.every(k => {
        if (k === 'mod') return e.ctrlKey || e.metaKey;
        return k.toLowerCase() === e.key.toLowerCase();
      });
    });

    if (shortcut) {
      e.preventDefault();
      e.stopPropagation();
      shortcut.handler();
    }
  }, [shortcuts, enabled, ignoreInput]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// 预定义的快捷键描述（用于帮助菜单）
export const keyboardShortcutDescriptions = [
  { key: 'n', description: '新建待办事项' },
  { key: '/', description: '聚焦搜索框' },
  { key: '1', description: '显示全部' },
  { key: '2', description: '显示进行中' },
  { key: '3', description: '显示已完成' },
  { key: 'Esc', description: '关闭弹窗 / 取消编辑' },
  { key: 'mod+z', description: '撤销删除' },
  { key: 'mod+d', description: '切换深色模式' },
];

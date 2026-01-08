'use client';

import { useState, useCallback, useEffect } from 'react';
import { Todo } from '@/lib/types';

type NotificationPermission = 'default' | 'granted' | 'denied';

interface ScheduledNotification {
  id: string;
  todoId: string;
  scheduledTime: number;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [scheduled, setScheduled] = useState<ScheduledNotification[]>([]);

  // 请求通知权限
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('此浏览器不支持通知');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, []);

  // 检查是否已授权
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission as NotificationPermission);
    }
  }, []);

  // 安排通知
  const scheduleNotification = useCallback((todo: Todo, minutesBefore: number = 30) => {
    if (!todo.dueDate || permission !== 'granted') return null;

    const dueDate = new Date(todo.dueDate);
    const notifyTime = dueDate.getTime() - minutesBefore * 60 * 1000;
    const now = Date.now();

    if (notifyTime <= now) return null; // 已经过期

    const notificationId = `${todo.id}-${minutesBefore}`;

    // 清除已存在的同ID通知
    clearNotification(todo.id, minutesBefore);

    const timeoutId = window.setTimeout(() => {
      showNotification({
        title: '待办提醒',
        body: todo.content,
        tag: notificationId,
      });
      // 移除已调度的通知
      setScheduled(prev => prev.filter(n => n.id !== notificationId));
    }, notifyTime - now);

    const scheduledNotification: ScheduledNotification = {
      id: notificationId,
      todoId: todo.id,
      scheduledTime: notifyTime,
    };

    setScheduled(prev => [...prev, scheduledNotification]);

    // 返回清理函数
    return () => {
      window.clearTimeout(timeoutId);
      setScheduled(prev => prev.filter(n => n.id !== notificationId));
    };
  }, [permission]);

  // 清除特定通知
  const clearNotification = useCallback((todoId: string, minutesBefore?: number) => {
    setScheduled(prev => {
      const toRemove = prev.filter(n => {
        if (n.todoId !== todoId) return false;
        if (minutesBefore) {
          return n.id.includes(`-${minutesBefore}`);
        }
        return true;
      });

      // 实际清除 timeout（这里简化处理，实际应该存储 timeoutId）
      return prev.filter(n => !toRemove.includes(n));
    });
  }, []);

  // 显示通知
  const showNotification = useCallback((options: {
    title: string;
    body: string;
    tag?: string;
    icon?: string;
  }) => {
    if (permission !== 'granted') return false;

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        tag: options.tag,
        icon: options.icon || '/favicon.ico',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return false;
    }
  }, [permission]);

  // 清除所有已安排的通知
  const clearAllNotifications = useCallback(() => {
    setScheduled([]);
  }, []);

  return {
    permission,
    requestPermission,
    scheduleNotification,
    clearNotification,
    clearAllNotifications,
    showNotification,
    scheduledCount: scheduled.length,
  };
}

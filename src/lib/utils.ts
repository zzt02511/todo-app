import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  const now = new Date();
  const target = new Date(date);
  const isToday = now.toDateString() === target.toDateString();
  const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === target.toDateString();

  if (isToday) {
    return '今天';
  } else if (isYesterday) {
    return '昨天';
  } else {
    return target.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
    });
  }
}

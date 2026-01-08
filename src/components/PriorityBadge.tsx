'use client';

import { Priority } from '@/lib/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  onClick?: () => void;
  interactive?: boolean;
}

const priorityConfig = {
  high: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
    label: '高',
  },
  medium: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-600 dark:text-yellow-400',
    label: '中',
  },
  low: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-600 dark:text-green-400',
    label: '低',
  },
};

export function PriorityBadge({
  priority,
  size = 'md',
  showLabel = true,
  onClick,
  interactive = false,
}: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  const sizeClasses = size === 'sm'
    ? 'px-1.5 py-0.5 text-xs'
    : 'px-2 py-0.5 text-xs';

  const Component = onClick ? motion.button : 'span';
  const componentProps = onClick ? {
    whileHover: interactive ? { scale: 1.05 } : undefined,
    whileTap: interactive ? { scale: 0.95 } : undefined,
    onClick,
  } : {};

  return (
    <Component
      {...componentProps}
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        sizeClasses,
        config.bg,
        config.text,
        interactive && 'cursor-pointer hover:opacity-80 transition-opacity'
      )}
      title={interactive ? `点击切换优先级 (当前: ${config.label})` : undefined}
    >
      {showLabel && config.label}
    </Component>
  );
}

// 循环切换优先级
export function cyclePriority(current: Priority): Priority {
  const priorities: Priority[] = ['high', 'medium', 'low'];
  const currentIndex = priorities.indexOf(current);
  return priorities[(currentIndex + 1) % priorities.length];
}

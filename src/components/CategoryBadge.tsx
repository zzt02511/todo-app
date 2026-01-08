'use client';

import { Category } from '@/lib/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CategoryBadgeProps {
  category: Category;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  showLabel?: boolean;
  onClick?: () => void;
  interactive?: boolean;
}

const categoryConfig = {
  work: {
    icon: '💼',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    label: '工作',
  },
  life: {
    icon: '🏠',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-600 dark:text-orange-400',
    label: '生活',
  },
  study: {
    icon: '📚',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    label: '学习',
  },
  health: {
    icon: '❤️',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
    label: '健康',
  },
  other: {
    icon: '📌',
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-600 dark:text-gray-400',
    label: '其他',
  },
};

export function CategoryBadge({
  category,
  size = 'md',
  showIcon = true,
  showLabel = true,
  onClick,
  interactive = false,
}: CategoryBadgeProps) {
  const config = categoryConfig[category];
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs';

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
        'inline-flex items-center gap-0.5 rounded-full font-medium',
        sizeClasses,
        config.bg,
        config.text,
        interactive && 'cursor-pointer hover:opacity-80 transition-opacity'
      )}
      title={interactive ? `点击切换分类 (当前: ${config.label})` : undefined}
    >
      {showIcon && <span>{config.icon}</span>}
      {showLabel && <span>{config.label}</span>}
    </Component>
  );
}

// 所有分类列表
export const allCategories: Category[] = ['work', 'life', 'study', 'health', 'other'];

// 循环切换分类
export function cycleCategory(current: Category): Category {
  const categories: Category[] = ['work', 'life', 'study', 'health', 'other'];
  const currentIndex = categories.indexOf(current);
  return categories[(currentIndex + 1) % categories.length];
}

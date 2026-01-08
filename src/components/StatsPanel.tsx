'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Todo, TodoStats, Category } from '@/lib/types';
import { TrendingUp, Calendar, Target, Zap } from 'lucide-react';

interface StatsPanelProps {
  todos: Todo[];
}

const categoryConfig: Record<Category, { icon: string; label: string }> = {
  work: { icon: '💼', label: '工作' },
  life: { icon: '🏠', label: '生活' },
  study: { icon: '📚', label: '学习' },
  health: { icon: '❤️', label: '健康' },
  other: { icon: '📌', label: '其他' },
};

export function StatsPanel({ todos }: StatsPanelProps) {
  const stats: TodoStats = useMemo(() => {
    const total = todos.length;
    const active = todos.filter(t => !t.completed).length;
    const completed = todos.filter(t => t.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 计算连续完成天数
    const completedTodos = todos
      .filter(t => t.completed && t.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

    let streakDays = 0;
    if (completedTodos.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastCompleted = new Date(completedTodos[0].completedAt!);
      lastCompleted.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((today.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        streakDays = 1;
        let currentDate = lastCompleted;
        for (let i = 1; i < completedTodos.length; i++) {
          const prevDate = new Date(completedTodos[i].completedAt!);
          prevDate.setHours(0, 0, 0, 0);
          const expectedDate = new Date(currentDate);
          expectedDate.setDate(expectedDate.getDate() - 1);

          if (prevDate.getTime() === expectedDate.getTime()) {
            streakDays++;
            currentDate = prevDate;
          } else {
            break;
          }
        }
      }
    }

    // 按分类统计
    const byCategory: Record<Category, number> = {
      work: 0,
      life: 0,
      study: 0,
      health: 0,
      other: 0,
    };
    todos.forEach(t => {
      byCategory[t.category]++;
    });

    return {
      total,
      active,
      completed,
      completionRate,
      streakDays,
      byCategory,
    };
  }, [todos]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-4 space-y-4"
    >
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">统计概览</h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Completion Rate */}
        <div className="flex items-center gap-3 p-3 bg-[var(--card-hover)] rounded-xl">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Target className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.completionRate}%</p>
            <p className="text-xs text-[var(--text-muted)]">完成率</p>
          </div>
        </div>

        {/* Streak Days */}
        <div className="flex items-center gap-3 p-3 bg-[var(--card-hover)] rounded-xl">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Zap className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.streakDays}</p>
            <p className="text-xs text-[var(--text-muted)]">连续天数</p>
          </div>
        </div>

        {/* Active Count */}
        <div className="flex items-center gap-3 p-3 bg-[var(--card-hover)] rounded-xl">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.active}</p>
            <p className="text-xs text-[var(--text-muted)]">进行中</p>
          </div>
        </div>

        {/* Total Count */}
        <div className="flex items-center gap-3 p-3 bg-[var(--card-hover)] rounded-xl">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</p>
            <p className="text-xs text-[var(--text-muted)]">总事项</p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--text-secondary)]">分类分布</p>
        <div className="space-y-1.5">
          {(Object.keys(stats.byCategory) as Category[]).map((category) => {
            const count = stats.byCategory[category];
            if (count === 0) return null;
            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

            return (
              <div key={category} className="flex items-center gap-2">
                <span className="text-sm w-12 text-[var(--text-muted)]">
                  {categoryConfig[category].icon} {categoryConfig[category].label}
                </span>
                <div className="flex-1 h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={cn(
                      'h-full rounded-full',
                      category === 'work' && 'bg-blue-500',
                      category === 'life' && 'bg-orange-500',
                      category === 'study' && 'bg-purple-500',
                      category === 'health' && 'bg-red-500',
                      category === 'other' && 'bg-gray-500'
                    )}
                  />
                </div>
                <span className="text-sm text-[var(--text-secondary)] w-8 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

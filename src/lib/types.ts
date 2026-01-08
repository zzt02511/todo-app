// ============ 类型定义 ============

// 优先级类型
export type Priority = 'high' | 'medium' | 'low';

// 分类类型 (固定标签)
export type Category = 'work' | 'life' | 'study' | 'health' | 'other';

// 重复类型
export type RepeatType = 'daily' | 'weekly' | 'monthly' | 'yearly';

// 筛选类型
export type FilterType = 'all' | 'active' | 'completed';

// 筛选分类
export type CategoryFilter = 'all' | Category;

// 待办事项接口
export interface Todo {
  id: string;
  content: string;
  completed: boolean;
  dueDate: string | null; // YYYY-MMDD 格式
  priority: Priority; // 优先级
  category: Category; // 分类
  repeatType: RepeatType | null; // 重复类型
  repeatEndDate: string | null; // 重复结束日期
  completedAt: Date | null; // 完成时间戳
  sortOrder: number; // 排序权重
  isArchived: boolean; // 是否归档
  subtasks: Subtask[]; // 子任务列表 (加载时关联查询)
  createdAt: Date;
  updatedAt: Date;
}

// 子任务接口
export interface Subtask {
  id: string;
  todoId: string;
  content: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 已删除待办 (用于撤销功能)
export interface DeletedTodo {
  id: string;
  content: string;
  completed: boolean;
  dueDate: string | null;
  priority: Priority;
  category: Category;
  repeatType: RepeatType | null;
  repeatEndDate: string | null;
  deletedAt: Date;
  expiresAt: Date;
}

// 统计信息接口
export interface TodoStats {
  total: number;
  active: number;
  completed: number;
  completionRate: number;
  streakDays: number;
  byCategory: Record<Category, number>;
}

// 导入数据接口
export interface ImportData {
  version: string;
  exportDate: string;
  todos: Array<{
    content: string;
    completed: boolean;
    dueDate: string | null;
    priority?: Priority;
    category?: Category;
    repeatType?: RepeatType | null;
    repeatEndDate?: string | null;
  }>;
}

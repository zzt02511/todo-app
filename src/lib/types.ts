export interface Todo {
  id: string;
  content: string;
  completed: boolean;
  dueDate: string | null; // YYYY-MM-DD 格式
  createdAt: Date;
  updatedAt: Date;
}

export type FilterType = 'all' | 'active' | 'completed';

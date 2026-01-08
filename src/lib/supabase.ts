import { createClient } from '@supabase/supabase-js';
import { Todo, Subtask, DeletedTodo } from './types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface AppConfigRow {
  id: string;
  config_key: string;
  config_value: string;
  created_at: string;
  updated_at: string;
}

// ============ 配置策略 ============
// 配置从数据库读取，环境变量作为初始连接
// 所有用户共享同一个数据库配置

// 从环境变量获取初始配置
function getInitialConfig(): SupabaseConfig {
  if (typeof window === 'undefined') {
    return { url: '', anonKey: '' };
  }
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  };
}

// 从 localStorage 获取配置
function getLocalConfig(): SupabaseConfig {
  if (typeof window === 'undefined') return { url: '', anonKey: '' };
  return {
    url: localStorage.getItem('supabase_url') || '',
    anonKey: localStorage.getItem('supabase_anon_key') || '',
  };
}

export function getSupabaseUrl(): string {
  const local = getLocalConfig();
  if (local.url && local.anonKey) return local.url;

  const initial = getInitialConfig();
  return initial.url;
}

export function getSupabaseAnonKey(): string {
  const local = getLocalConfig();
  if (local.url && local.anonKey) return local.anonKey;

  const initial = getInitialConfig();
  return initial.anonKey;
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return !!(url && key);
}

export function getSupabaseClient() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey);
}

/**
 * 获取初始客户端（用于首次连接数据库读取配置）
 */
function getInitClient(): ReturnType<typeof createClient> | null {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (url && anonKey) {
    return createClient(url, anonKey);
  }

  return null;
}

/**
 * 同步配置到数据库（保存连接后调用）
 */
export async function syncConfigToDatabase(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) return false;

  try {
    // 使用 upsert 保存配置（只有一条记录，id 为 'app_config'）
    const { error } = await client
      .from('app_config')
      .upsert({
        id: 'app_config',
        config_key: 'supabase_config',
        config_value: JSON.stringify({ url, anonKey }),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('Failed to sync config to database:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to sync config to database:', err);
    return false;
  }
}

/**
 * 从数据库加载配置（启动时调用）
 * 返回是否成功从数据库加载了配置
 */
export async function loadConfigFromDatabase(): Promise<boolean> {
  const client = getInitClient();
  if (!client) return false;

  try {
    const { data, error } = await client
      .from('app_config')
      .select('config_value')
      .eq('id', 'app_config')
      .single() as { data: AppConfigRow | null; error: Error | null };

    if (error || !data) {
      return false;
    }

    const config = JSON.parse(data.config_value);
    if (config.url && config.anonKey) {
      // 保存到 localStorage 以便后续使用
      saveSupabaseConfig(config);
      return true;
    }

    return false;
  } catch (err) {
    console.error('Failed to load config from database:', err);
    return false;
  }
}

/**
 * 从数据库获取配置（不依赖 localStorage）
 * 外部传入 Supabase 客户端，返回配置对象或 null
 */
export async function fetchConfigFromDatabase(
  client: ReturnType<typeof createClient>
): Promise<SupabaseConfig | null> {
  try {
    const { data, error } = await client
      .from('app_config')
      .select('config_value')
      .eq('id', 'app_config')
      .single() as { data: AppConfigRow | null; error: Error | null };

    if (error || !data) {
      return null;
    }

    const config = JSON.parse(data.config_value);
    if (config.url && config.anonKey) {
      return config;
    }

    return null;
  } catch (err) {
    console.error('Failed to fetch config from database:', err);
    return null;
  }
}

/**
 * 检查数据库中是否有配置
 */
export async function hasConfigInDatabase(): Promise<boolean> {
  const client = getInitClient();
  if (!client) return false;

  try {
    const { data, error } = await client
      .from('app_config')
      .select('id')
      .eq('id', 'app_config')
      .single() as { data: AppConfigRow | null; error: Error | null };

    return !error && !!data;
  } catch {
    return false;
  }
}

export function saveSupabaseConfig(config: SupabaseConfig) {
  localStorage.setItem('supabase_url', config.url);
  localStorage.setItem('supabase_anon_key', config.anonKey);
}

export function clearSupabaseConfig() {
  localStorage.removeItem('supabase_url');
  localStorage.removeItem('supabase_anon_key');
}

// ============ Todo CRUD Operations ============

export interface TodoRow {
  id: string;
  content: string;
  completed: boolean;
  due_date: string | null;
  priority: string;
  category: string;
  repeat_type: string | null;
  repeat_end_date: string | null;
  completed_at: string | null;
  sort_order: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export function rowToTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    content: row.content,
    completed: row.completed,
    dueDate: row.due_date,
    priority: row.priority as Todo['priority'],
    category: row.category as Todo['category'],
    repeatType: row.repeat_type as Todo['repeatType'],
    repeatEndDate: row.repeat_end_date,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    sortOrder: row.sort_order,
    isArchived: row.is_archived,
    subtasks: [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function todoToRow(todo: Todo): Omit<TodoRow, 'id'> {
  return {
    content: todo.content,
    completed: todo.completed,
    due_date: todo.dueDate,
    priority: todo.priority,
    category: todo.category,
    repeat_type: todo.repeatType,
    repeat_end_date: todo.repeatEndDate,
    completed_at: todo.completedAt?.toISOString() || null,
    sort_order: todo.sortOrder,
    is_archived: todo.isArchived,
    created_at: todo.createdAt.toISOString(),
    updated_at: todo.updatedAt.toISOString(),
  };
}

export async function fetchTodos(): Promise<Todo[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('is_archived', false)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch todos:', error);
    return [];
  }

  return data.map(rowToTodo);
}

export async function saveTodo(todo: Todo): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from('todos')
    .upsert(todoToRow(todo), { onConflict: 'id' });

  if (error) {
    console.error('Failed to save todo:', error);
    return false;
  }

  return true;
}

export async function deleteTodoById(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete todo:', error);
    return false;
  }

  return true;
}

export async function deleteTodosByIds(ids: string[]): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from('todos')
    .delete()
    .in('id', ids);

  if (error) {
    console.error('Failed to delete todos:', error);
    return false;
  }

  return true;
}

// ============ Subtask Operations ============

export interface SubtaskRow {
  id: string;
  todo_id: string;
  content: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export function rowToSubtask(row: SubtaskRow): Subtask {
  return {
    id: row.id,
    todoId: row.todo_id,
    content: row.content,
    completed: row.completed,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function subtaskToRow(subtask: Subtask): Omit<SubtaskRow, 'id'> {
  return {
    todo_id: subtask.todoId,
    content: subtask.content,
    completed: subtask.completed,
    created_at: subtask.createdAt.toISOString(),
    updated_at: subtask.updatedAt.toISOString(),
  };
}

export async function fetchSubtasks(todoId: string): Promise<Subtask[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('subtasks')
    .select('*')
    .eq('todo_id', todoId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch subtasks:', error);
    return [];
  }

  return data.map(rowToSubtask);
}

export async function saveSubtask(subtask: Subtask): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from('subtasks')
    .upsert(subtaskToRow(subtask), { onConflict: 'id' });

  if (error) {
    console.error('Failed to save subtask:', error);
    return false;
  }

  return true;
}

export async function deleteSubtask(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from('subtasks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete subtask:', error);
    return false;
  }

  return true;
}

export async function deleteSubtasksByTodoId(todoId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from('subtasks')
    .delete()
    .eq('todo_id', todoId);

  if (error) {
    console.error('Failed to delete subtasks:', error);
    return false;
  }

  return true;
}

// ============ Deleted Todo Operations (for undo) ============

export interface DeletedTodoRow {
  id: string;
  content: string;
  completed: boolean;
  due_date: string | null;
  priority: string;
  category: string;
  repeat_type: string | null;
  repeat_end_date: string | null;
  deleted_at: string;
  expires_at: string;
}

export function rowToDeletedTodo(row: DeletedTodoRow): DeletedTodo {
  return {
    id: row.id,
    content: row.content,
    completed: row.completed,
    dueDate: row.due_date,
    priority: row.priority as DeletedTodo['priority'],
    category: row.category as DeletedTodo['category'],
    repeatType: row.repeat_type as DeletedTodo['repeatType'],
    repeatEndDate: row.repeat_end_date,
    deletedAt: new Date(row.deleted_at),
    expiresAt: new Date(row.expires_at),
  };
}

export async function saveDeletedTodo(todo: Todo): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + 30); // 30秒后过期

  const { error } = await supabase
    .from('deleted_todos')
    .upsert({
      id: todo.id,
      content: todo.content,
      completed: todo.completed,
      due_date: todo.dueDate,
      priority: todo.priority,
      category: todo.category,
      repeat_type: todo.repeatType,
      repeat_end_date: todo.repeatEndDate,
      deleted_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    }, { onConflict: 'id' });

  if (error) {
    console.error('Failed to save deleted todo:', error);
    return false;
  }

  return true;
}

export async function fetchLatestDeletedTodo(): Promise<DeletedTodo | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('deleted_todos')
    .select('*')
    .gte('expires_at', new Date().toISOString())
    .order('deleted_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return rowToDeletedTodo(data as unknown as DeletedTodoRow);
}

export async function deleteDeletedTodo(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from('deleted_todos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete from deleted_todos:', error);
    return false;
  }

  return true;
}

export async function restoreTodo(todo: DeletedTodo): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from('todos')
    .upsert({
      id: todo.id,
      content: todo.content,
      completed: todo.completed,
      due_date: todo.dueDate,
      priority: todo.priority,
      category: todo.category,
      repeat_type: todo.repeatType,
      repeat_end_date: todo.repeatEndDate,
      completed_at: null,
      sort_order: 0,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) {
    console.error('Failed to restore todo:', error);
    return false;
  }

  return true;
}

// ============ Todo Order Operations ============

export async function updateTodoOrder(updates: { id: string; sort_order: number }[]): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  // 批量更新排序
  const { error } = await supabase
    .from('todos')
    .upsert(updates, { onConflict: 'id' });

  if (error) {
    console.error('Failed to update todo order:', error);
    return false;
  }

  return true;
}

// ============ Cleanup Operations ============

export async function cleanupExpiredDeletedTodos(): Promise<number> {
  const supabase = getSupabaseClient();
  if (!supabase) return 0;

  // 先查询要删除的记录数量
  const { data: toDelete, error: selectError } = await supabase
    .from('deleted_todos')
    .select('id')
    .lt('expires_at', new Date().toISOString());

  if (selectError) {
    console.error('Failed to select expired deleted todos:', selectError);
    return 0;
  }

  if (!toDelete || toDelete.length === 0) {
    return 0;
  }

  // 删除记录
  const { error } = await supabase
    .from('deleted_todos')
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('Failed to cleanup expired deleted todos:', error);
    return 0;
  }

  return toDelete.length;
}

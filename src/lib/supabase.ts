import { createClient } from '@supabase/supabase-js';
import { Todo } from './types';

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

// ============ 配置存储策略 ============
// 优先级：localStorage > 数据库
// 先尝试从数据库读取，失败则降级到 localStorage

export function getSupabaseUrl(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('supabase_url') || '';
}

export function getSupabaseAnonKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('supabase_anon_key') || '';
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
 * 初始化 Supabase 客户端（从 localStorage 或默认环境变量）
 */
function getInitClient(): ReturnType<typeof createClient> | null {
  // 优先使用 localStorage 中的配置
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
  created_at: string;
  updated_at: string;
}

export function rowToTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    content: row.content,
    completed: row.completed,
    dueDate: row.due_date,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function todoToRow(todo: Todo): Omit<TodoRow, 'id'> {
  return {
    content: todo.content,
    completed: todo.completed,
    due_date: todo.dueDate,
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

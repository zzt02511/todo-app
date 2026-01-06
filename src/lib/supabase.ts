import { createClient } from '@supabase/supabase-js';
import { Todo } from './types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

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

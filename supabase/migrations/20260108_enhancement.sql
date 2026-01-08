-- =====================================================
-- 待办事项应用数据库迁移脚本
-- 执行时间: 2026-01-08
-- =====================================================

-- ⚠️ 在 Supabase SQL 编辑器中执行此脚本
-- 路径: Dashboard -> SQL Editor -> New query -> 粘贴执行

-- =====================================================
-- 第一部分：添加 todos 表新字段
-- =====================================================

-- 1.1 添加 priority 字段 (高/中/低)
ALTER TABLE todos ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low'));

-- 1.2 添加 category 字段 (工作/生活/学习/健康/其他)
ALTER TABLE todos ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other' CHECK (category IN ('work', 'life', 'study', 'health', 'other'));

-- 1.3 添加 repeat_type 字段 (每天/每周/每月/每年)
ALTER TABLE todos ADD COLUMN IF NOT EXISTS repeat_type TEXT CHECK (repeat_type IN ('daily', 'weekly', 'monthly', 'yearly'));

-- 1.4 添加 repeat_end_date 字段
ALTER TABLE todos ADD COLUMN IF NOT EXISTS repeat_end_date DATE;

-- 1.5 添加 completed_at 字段 (完成时间戳)
ALTER TABLE todos ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 1.6 添加 sort_order 字段 (排序)
ALTER TABLE todos ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 1.7 添加 is_archived 字段 (归档)
ALTER TABLE todos ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- 1.8 更新现有记录的默认值
UPDATE todos SET priority = 'medium' WHERE priority IS NULL;
UPDATE todos SET category = 'other' WHERE category IS NULL;

-- =====================================================
-- 第二部分：创建子任务表
-- =====================================================

CREATE TABLE IF NOT EXISTS subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_subtasks_todo_id ON subtasks(todo_id);

-- =====================================================
-- 第三部分：创建已删除暂存表 (用于撤销功能)
-- =====================================================

CREATE TABLE IF NOT EXISTS deleted_todos (
  id UUID PRIMARY KEY,
  content TEXT,
  completed BOOLEAN,
  due_date DATE,
  priority TEXT,
  category TEXT,
  repeat_type TEXT,
  repeat_end_date DATE,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 seconds')
);

CREATE INDEX IF NOT EXISTS idx_deleted_todos_expires_at ON deleted_todos(expires_at);

-- =====================================================
-- 第四部分：创建辅助函数
-- =====================================================

-- 清理过期已删除记录的函数 (可设置定时任务调用)
CREATE OR REPLACE FUNCTION cleanup_expired_deleted_todos()
RETURNS INTEGER AS $$
BEGIN
  DELETE FROM deleted_todos WHERE expires_at < NOW();
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 验证迁移是否成功
-- =====================================================

-- 检查新字段是否存在
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'todos'
AND column_name IN ('priority', 'category', 'repeat_type', 'repeat_end_date', 'completed_at', 'sort_order', 'is_archived');

-- 检查子任务表是否存在
SELECT table_name FROM information_schema.tables WHERE table_name = 'subtasks';

-- 检查已删除暂存表是否存在
SELECT table_name FROM information_schema.tables WHERE table_name = 'deleted_todos';

-- =====================================================
-- 迁移完成提示
-- =====================================================

-- 运行下方命令查看所有表结构
-- SELECT * FROM information_schema.tables WHERE table_schema = 'public';

-- 如果需要回滚，执行以下命令 (删除新表和字段):
-- DROP TABLE IF EXISTS subtasks;
-- DROP TABLE IF EXISTS deleted_todos;
-- ALTER TABLE todos DROP COLUMN IF EXISTS priority;
-- ALTER TABLE todos DROP COLUMN IF EXISTS category;
-- ALTER TABLE todos DROP COLUMN IF EXISTS repeat_type;
-- ALTER TABLE todos DROP COLUMN IF EXISTS repeat_end_date;
-- ALTER TABLE todos DROP COLUMN IF EXISTS completed_at;
-- ALTER TABLE todos DROP COLUMN IF EXISTS sort_order;
-- ALTER TABLE todos DROP COLUMN IF EXISTS is_archived;

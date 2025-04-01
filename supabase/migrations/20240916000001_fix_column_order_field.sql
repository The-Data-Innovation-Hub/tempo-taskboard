-- Rename 'order' column to 'column_order' in columns table
ALTER TABLE IF EXISTS columns RENAME COLUMN "order" TO column_order;

-- Rename 'order' column to 'task_order' in tasks table
ALTER TABLE IF EXISTS tasks RENAME COLUMN "order" TO task_order;
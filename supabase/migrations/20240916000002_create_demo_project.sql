-- Create temporary tables to store IDs
CREATE TEMPORARY TABLE temp_project_id (id UUID);
CREATE TEMPORARY TABLE temp_columns (id UUID, column_order INT);
CREATE TEMPORARY TABLE temp_tasks (id UUID);
CREATE TEMPORARY TABLE temp_labels (id UUID, name TEXT);
CREATE TEMPORARY TABLE temp_users (id UUID, email TEXT);

-- Create a demo project
WITH project_insert AS (
  INSERT INTO projects (id, title, description, is_favorite, user_id)
  VALUES (gen_random_uuid(), 'Project Management Board', 'A Trello-like project management board with neumorphic design', false, 'demo-user')
  RETURNING id
)
INSERT INTO temp_project_id
SELECT id FROM project_insert;

-- Create demo columns
WITH columns_insert AS (
  INSERT INTO columns (id, title, project_id, column_order)
  VALUES 
    (gen_random_uuid(), 'Backlog', (SELECT id FROM temp_project_id), 0),
    (gen_random_uuid(), 'In Progress', (SELECT id FROM temp_project_id), 1),
    (gen_random_uuid(), 'Completed', (SELECT id FROM temp_project_id), 2)
  RETURNING id, column_order
)
INSERT INTO temp_columns
SELECT id, column_order FROM columns_insert;

-- Create demo tasks
WITH tasks_insert AS (
  INSERT INTO tasks (id, title, description, column_id, project_id, task_order, user_id, due_date)
  VALUES
    (gen_random_uuid(), 'Research competitors', 'Analyze top 5 competitors in the market', (SELECT id FROM temp_columns WHERE column_order = 0), (SELECT id FROM temp_project_id), 0, 'demo-user', NOW() + INTERVAL '3 days'),
    (gen_random_uuid(), 'Create wireframes', 'Design initial wireframes for the dashboard', (SELECT id FROM temp_columns WHERE column_order = 0), (SELECT id FROM temp_project_id), 1, 'demo-user', NOW() + INTERVAL '5 days'),
    (gen_random_uuid(), 'Implement authentication', 'Set up user authentication with JWT', (SELECT id FROM temp_columns WHERE column_order = 1), (SELECT id FROM temp_project_id), 0, 'demo-user', NOW() + INTERVAL '2 days'),
    (gen_random_uuid(), 'Project setup', 'Initialize repository and set up development environment', (SELECT id FROM temp_columns WHERE column_order = 2), (SELECT id FROM temp_project_id), 0, 'demo-user', NOW() - INTERVAL '1 day')
  RETURNING id
)
INSERT INTO temp_tasks
SELECT id FROM tasks_insert;

-- Create demo labels
WITH labels_insert AS (
  INSERT INTO labels (id, name, color)
  VALUES
    (gen_random_uuid(), 'Research', '#0089AD'),
    (gen_random_uuid(), 'Design', '#00AD89'),
    (gen_random_uuid(), 'Development', '#5D5FEF'),
    (gen_random_uuid(), 'Setup', '#F59E0B')
  RETURNING id, name
)
INSERT INTO temp_labels
SELECT id, name FROM labels_insert;

-- Associate labels with tasks
INSERT INTO task_labels (task_id, label_id)
VALUES
  ((SELECT id FROM temp_tasks LIMIT 1 OFFSET 0), (SELECT id FROM temp_labels WHERE name = 'Research')),
  ((SELECT id FROM temp_tasks LIMIT 1 OFFSET 1), (SELECT id FROM temp_labels WHERE name = 'Design')),
  ((SELECT id FROM temp_tasks LIMIT 1 OFFSET 2), (SELECT id FROM temp_labels WHERE name = 'Development')),
  ((SELECT id FROM temp_tasks LIMIT 1 OFFSET 3), (SELECT id FROM temp_labels WHERE name = 'Setup'));

-- Create demo users
WITH users_insert AS (
  INSERT INTO auth.users (id, email, created_at)
  VALUES
    (gen_random_uuid(), 'alex@example.com', NOW()),
    (gen_random_uuid(), 'sam@example.com', NOW()),
    (gen_random_uuid(), 'jamie@example.com', NOW()),
    (gen_random_uuid(), 'taylor@example.com', NOW())
  RETURNING id, email
)
INSERT INTO temp_users
SELECT id, email FROM users_insert;

-- Create demo profiles
INSERT INTO profiles (id, name, email, avatar)
VALUES
  ((SELECT id FROM temp_users WHERE email = 'alex@example.com'), 'Alex Johnson', 'alex@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'),
  ((SELECT id FROM temp_users WHERE email = 'sam@example.com'), 'Sam Taylor', 'sam@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam'),
  ((SELECT id FROM temp_users WHERE email = 'jamie@example.com'), 'Jamie Lee', 'jamie@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jamie'),
  ((SELECT id FROM temp_users WHERE email = 'taylor@example.com'), 'Taylor Kim', 'taylor@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor');

-- Associate users with tasks
INSERT INTO task_assignees (task_id, user_id)
VALUES
  ((SELECT id FROM temp_tasks LIMIT 1 OFFSET 0), (SELECT id FROM temp_users WHERE email = 'alex@example.com')),
  ((SELECT id FROM temp_tasks LIMIT 1 OFFSET 1), (SELECT id FROM temp_users WHERE email = 'sam@example.com')),
  ((SELECT id FROM temp_tasks LIMIT 1 OFFSET 2), (SELECT id FROM temp_users WHERE email = 'jamie@example.com')),
  ((SELECT id FROM temp_tasks LIMIT 1 OFFSET 3), (SELECT id FROM temp_users WHERE email = 'taylor@example.com'));

-- Drop temporary tables
DROP TABLE temp_project_id;
DROP TABLE temp_columns;
DROP TABLE temp_tasks;
DROP TABLE temp_labels;
DROP TABLE temp_users;
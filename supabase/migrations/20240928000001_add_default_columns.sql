-- Function to create default columns for a project
CREATE OR REPLACE FUNCTION create_default_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default columns for the new project
  INSERT INTO columns (title, project_id, "order")
  VALUES 
    ('Backlog', NEW.id, 0),
    ('Next Week', NEW.id, 1),
    ('Working On', NEW.id, 2),
    ('On Hold', NEW.id, 3),
    ('Completed', NEW.id, 4);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to add default columns when a new project is created
DROP TRIGGER IF EXISTS add_default_columns ON projects;
CREATE TRIGGER add_default_columns
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION create_default_columns();

-- Add default columns to existing projects that don't have any columns yet
DO $$
DECLARE
  project_record RECORD;
BEGIN
  FOR project_record IN 
    SELECT p.id 
    FROM projects p
    WHERE NOT EXISTS (
      SELECT 1 FROM columns c WHERE c.project_id = p.id
    )
  LOOP
    INSERT INTO columns (title, project_id, "order")
    VALUES 
      ('Backlog', project_record.id, 0),
      ('Next Week', project_record.id, 1),
      ('Working On', project_record.id, 2),
      ('On Hold', project_record.id, 3),
      ('Completed', project_record.id, 4);
  END LOOP;
END;
$$;
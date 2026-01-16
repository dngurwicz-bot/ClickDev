-- Function to track employee changes
CREATE OR REPLACE FUNCTION track_employee_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Track job_title changes
  IF OLD.job_title IS DISTINCT FROM NEW.job_title THEN
    INSERT INTO employee_history (
      employee_id, organization_id, field_name, 
      old_value, new_value, valid_from, changed_by
    ) VALUES (
      OLD.id, OLD.organization_id, 'job_title',
      OLD.job_title, NEW.job_title, NOW(), auth.uid()
    );
  END IF;
  
  -- Track salary changes
  IF OLD.salary IS DISTINCT FROM NEW.salary THEN
    INSERT INTO employee_history (
      employee_id, organization_id, field_name, 
      old_value, new_value, valid_from, changed_by
    ) VALUES (
      OLD.id, OLD.organization_id, 'salary',
      OLD.salary::TEXT, NEW.salary::TEXT, NOW(), auth.uid()
    );
  END IF;
  
  -- Track department changes
  IF OLD.department IS DISTINCT FROM NEW.department THEN
    INSERT INTO employee_history (
      employee_id, organization_id, field_name, 
      old_value, new_value, valid_from, changed_by
    ) VALUES (
      OLD.id, OLD.organization_id, 'department',
      OLD.department, NEW.department, NOW(), auth.uid()
    );
  END IF;
  
  -- Track manager changes
  IF OLD.manager_id IS DISTINCT FROM NEW.manager_id THEN
    INSERT INTO employee_history (
      employee_id, organization_id, field_name, 
      old_value, new_value, valid_from, changed_by
    ) VALUES (
      OLD.id, OLD.organization_id, 'manager_id',
      COALESCE(OLD.manager_id::TEXT, 'NULL'), 
      COALESCE(NEW.manager_id::TEXT, 'NULL'), 
      NOW(), auth.uid()
    );
  END IF;
  
  -- Track status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO employee_history (
      employee_id, organization_id, field_name, 
      old_value, new_value, valid_from, changed_by
    ) VALUES (
      OLD.id, OLD.organization_id, 'status',
      OLD.status, NEW.status, NOW(), auth.uid()
    );
  END IF;
  
  -- Update updated_at timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to employees table
DROP TRIGGER IF EXISTS employee_changes_trigger ON employees;
CREATE TRIGGER employee_changes_trigger
  AFTER UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION track_employee_changes();

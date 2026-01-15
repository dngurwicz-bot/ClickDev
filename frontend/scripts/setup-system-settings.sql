-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_settings_key ON system_settings(key);

-- RLS Policy - Only super admins can manage settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can view settings" ON system_settings;
CREATE POLICY "Super admins can view settings"
  ON system_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Super admins can manage settings" ON system_settings;
CREATE POLICY "Super admins can manage settings"
  ON system_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Insert default settings
INSERT INTO system_settings (key, value, description) VALUES
  ('maintenance_mode', '{"enabled": false, "message": "המערכת בתחזוקה. אנא נסה שוב מאוחר יותר.", "message_en": "System is under maintenance. Please try again later."}', 'מצב תחזוקה כללי'),
  ('app_name', '"CLICK HR Platform"', 'שם האפליקציה'),
  ('default_language', '"he"', 'שפה ברירת מחדל')
ON CONFLICT (key) DO NOTHING;

-- Add maintenance fields to organizations if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'maintenance_message'
  ) THEN
    ALTER TABLE organizations ADD COLUMN maintenance_message TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'maintenance_mode'
  ) THEN
    ALTER TABLE organizations ADD COLUMN maintenance_mode BOOLEAN DEFAULT false;
  END IF;
END $$;

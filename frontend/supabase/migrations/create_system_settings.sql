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

CREATE POLICY "Super admins can view settings"
  ON system_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

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

-- Organization-specific maintenance messages
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS maintenance_message TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT false;

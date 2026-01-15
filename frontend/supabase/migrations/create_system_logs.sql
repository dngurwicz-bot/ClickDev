-- System Logs Table
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level VARCHAR(20) NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR', 'DEBUG')),
  message TEXT NOT NULL,
  context JSONB,
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_user ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_org ON system_logs(organization_id);

-- RLS Policy - Only super admins can view logs
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all logs"
  ON system_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

CREATE POLICY "System can insert logs"
  ON system_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Super admins can delete logs"
  ON system_logs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

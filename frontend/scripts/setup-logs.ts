import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupLogs() {
  console.log('Creating system_logs table...')
  
  // Create table
  const { error: tableError } = await supabase.rpc('exec', {
    query: `
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
    `
  })

  if (tableError) {
    console.log('Table might already exist or error:', tableError.message)
  }

  // Insert sample logs
  const sampleLogs = [
    {
      level: 'INFO',
      message: 'User logged in: dngurwicz@gmail.com',
      context: { action: 'login', success: true },
      created_at: new Date(Date.now() - 30 * 60000).toISOString() // 30 minutes ago
    },
    {
      level: 'INFO',
      message: 'Organization created: Test Org',
      context: { action: 'create_organization' },
      created_at: new Date(Date.now() - 25 * 60000).toISOString() // 25 minutes ago
    },
    {
      level: 'WARN',
      message: 'Failed login attempt from 192.168.1.1',
      context: { action: 'login', success: false, ip: '192.168.1.1' },
      created_at: new Date(Date.now() - 20 * 60000).toISOString() // 20 minutes ago
    },
    {
      level: 'INFO',
      message: 'Backup completed successfully',
      context: { action: 'backup', type: 'automatic' },
      created_at: new Date(Date.now() - 15 * 60000).toISOString() // 15 minutes ago
    },
    {
      level: 'ERROR',
      message: 'Database connection timeout',
      context: { action: 'database', error: 'timeout' },
      created_at: new Date(Date.now() - 10 * 60000).toISOString() // 10 minutes ago
    },
    {
      level: 'INFO',
      message: 'API request: GET /api/organizations',
      context: { action: 'api_request', method: 'GET', endpoint: '/api/organizations' },
      created_at: new Date(Date.now() - 5 * 60000).toISOString() // 5 minutes ago
    }
  ]

  const { error: insertError } = await supabase
    .from('system_logs')
    .insert(sampleLogs)

  if (insertError) {
    console.error('Error inserting logs:', insertError)
  } else {
    console.log('Sample logs created successfully!')
  }
}

setupLogs()

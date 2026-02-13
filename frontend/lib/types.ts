export type OrgRole = 'org_admin' | 'hr' | 'manager' | 'employee'
export type OrgStatus = 'active' | 'suspended'
export type ModuleKey = 'core' | 'flow' | 'docs' | 'assets' | 'vibe' | 'grow' | 'vision' | 'insights'

export type MeResponse = {
  user_id: string
  email?: string | null
  is_system_admin: boolean
  memberships: { org_id: string; role: OrgRole }[]
  default_org_id?: string | null
}

export type Org = {
  id: string
  name: string
  status: OrgStatus
  created_at: string
}

export type OrgMember = {
  id: string
  org_id: string
  user_id: string
  role: OrgRole
  created_at: string
}

export type ModuleFlag = {
  key: ModuleKey
  name: string
  is_enabled: boolean
}


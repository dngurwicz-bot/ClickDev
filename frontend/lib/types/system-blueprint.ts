export interface BlueprintMeta {
  id: string
  version_key: string
  product_name: string
  version: string
  language: string
  direction: 'rtl' | 'ltr'
  last_updated: string
  positioning: string
  target_companies: string[]
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface BlueprintModule {
  id: string
  row_id?: string
  order: number
  name: string
  category: string
  for_who: string
  description: string
  capabilities: string[]
  kpis: string[]
}

export interface BlueprintPhase {
  id?: string
  phase: number
  name: string
  duration_weeks: number
  deliverables: string[]
}

export interface BlueprintAlertEngine {
  id?: string
  name: string
  examples: string[]
}

export interface BlueprintVersionSummary {
  id: string
  version_key: string
  product_name: string
  is_published: boolean
  published_at: string | null
  last_updated: string
  created_at: string
  updated_at: string
}

export interface BlueprintPayload {
  meta: BlueprintMeta
  implementation_phases: BlueprintPhase[]
  modules: BlueprintModule[]
  smart_notifications: {
    channels: string[]
    engines: BlueprintAlertEngine[]
    escalation_policy: Record<string, string>
  }
  core_entities: string[]
  integration_targets: string[]
}

export interface BlueprintMeta {
  product_name: string
  version: string
  language: string
  direction: 'rtl' | 'ltr'
  last_updated: string
  positioning: string
  target_companies: string[]
}

export interface BlueprintModule {
  id: string
  order: number
  name: string
  category: string
  for_who: string
  description: string
  capabilities: string[]
  kpis: string[]
}

export interface BlueprintPhase {
  phase: number
  name: string
  duration_weeks: number
  deliverables: string[]
}

export interface BlueprintAlertEngine {
  name: string
  examples: string[]
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

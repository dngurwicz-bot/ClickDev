import { BlueprintPayload } from './types/system-blueprint'

export const fallbackBlueprintData: BlueprintPayload = {
  meta: {
    product_name: 'CLICK',
    version: '3.0',
    language: 'he-IL',
    direction: 'rtl',
    last_updated: '2026-02-11',
    positioning: 'ניהול מחזור חיי עובד - המפרט המלא',
    target_companies: ['SMB', 'Mid-Market', 'Enterprise'],
  },
  implementation_phases: [],
  modules: [],
  smart_notifications: {
    channels: ['in_app', 'email', 'push'],
    engines: [],
    escalation_policy: {},
  },
  core_entities: [],
  integration_targets: [],
}

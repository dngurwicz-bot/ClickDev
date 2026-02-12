import { BlueprintPayload } from './types/system-blueprint'

export const fallbackBlueprintData: BlueprintPayload = {
  meta: {
    id: 'fallback',
    version_key: '3.0',
    product_name: 'CLICK',
    version: '3.0',
    language: 'he-IL',
    direction: 'rtl',
    last_updated: '2026-02-11',
    positioning: 'ניהול מחזור חיי עובד - המפרט המלא',
    target_companies: ['SMB', 'Mid-Market', 'Enterprise'],
    is_published: false,
    published_at: null,
    created_at: '2026-02-11T00:00:00Z',
    updated_at: '2026-02-11T00:00:00Z',
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

import { supabase } from './supabase'
import type {
    ActiveScreen,
    ClickActionRequest,
    EmployeeFileResponse,
    EmployeeTimelineItem,
    OrganizationalSearchResult,
    SavedSearch,
    SearchMenuResult,
    ShortcutGroup,
    ShortcutItem,
    UiHomeConfig,
} from './types/models'

/**
 * Enhanced fetch that automatically includes the Supabase Authorization header
 */
export async function authFetch(url: string, options: RequestInit = {}) {
    const { data: { session } } = await supabase.auth.getSession()

    console.log('[authFetch] Session check:', {
        hasSession: !!session,
        hasToken: !!session?.access_token,
        tokenLength: session?.access_token?.length || 0,
        tokenStart: session?.access_token?.substring(0, 20),
        expiresAt: session?.expires_at
    })

    const headers = new Headers(options.headers || {})

    if (session?.access_token) {
        headers.set('Authorization', `Bearer ${session.access_token}`)
        console.log('[authFetch] Added Authorization header')
    } else {
        console.warn('[authFetch] No session or access token available!')
    }

    const finalUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`
    console.log(`[authFetch] Making request to: ${finalUrl}`)

    return fetch(url, {
        ...options,
        headers,
    })
}

export async function dispatchEmployeeAction(
    orgId: string,
    employeeId: string,
    body: ClickActionRequest,
) {
    const response = await authFetch(`/api/organizations/${orgId}/employees/${employeeId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to dispatch action')
    }
    return response.json()
}

export async function dispatchEmployeeCreateAction(orgId: string, body: ClickActionRequest) {
    const response = await authFetch(`/api/organizations/${orgId}/employees/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to create employee action')
    }
    return response.json()
}

export async function getEmployeeFile(orgId: string, employeeId: string): Promise<EmployeeFileResponse> {
    const response = await authFetch(`/api/organizations/${orgId}/employees/${employeeId}/file`)
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to fetch employee file')
    }
    return response.json()
}

export async function getEmployeeTimeline(orgId: string, employeeId: string): Promise<EmployeeTimelineItem[]> {
    const response = await authFetch(`/api/organizations/${orgId}/employees/${employeeId}/timeline`)
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to fetch timeline')
    }
    const data = await response.json()
    return data.timeline || []
}

export async function getUiHomeConfig(orgId: string): Promise<UiHomeConfig> {
    const response = await authFetch(`/api/organizations/${orgId}/ui/home`)
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to fetch home config')
    }
    return response.json()
}

export async function saveUiHomeConfig(orgId: string, widgetsJson: Record<string, unknown>) {
    const response = await authFetch(`/api/organizations/${orgId}/ui/home`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgets_json: widgetsJson }),
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to save home config')
    }
    return response.json()
}

export async function listShortcuts(orgId: string): Promise<ShortcutGroup[]> {
    const response = await authFetch(`/api/organizations/${orgId}/ui/shortcuts`)
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to list shortcuts')
    }
    const data = await response.json()
    return data.groups || []
}

export async function createShortcutGroup(orgId: string, name: string, displayOrder = 0): Promise<ShortcutGroup> {
    const response = await authFetch(`/api/organizations/${orgId}/ui/shortcuts/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, display_order: displayOrder }),
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to create shortcut group')
    }
    return response.json()
}

export async function createShortcut(
    orgId: string,
    payload: {
        group_id: string
        entity_type: string
        entity_key?: string
        label: string
        route: string
        display_order?: number
    }
): Promise<ShortcutItem> {
    const response = await authFetch(`/api/organizations/${orgId}/ui/shortcuts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to create shortcut')
    }
    return response.json()
}

export async function updateShortcut(
    orgId: string,
    shortcutId: string,
    payload: { label?: string; route?: string; display_order?: number }
): Promise<ShortcutItem> {
    const response = await authFetch(`/api/organizations/${orgId}/ui/shortcuts/${shortcutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to update shortcut')
    }
    return response.json()
}

export async function deleteShortcut(orgId: string, shortcutId: string) {
    const response = await authFetch(`/api/organizations/${orgId}/ui/shortcuts/${shortcutId}`, { method: 'DELETE' })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to delete shortcut')
    }
    return response.json()
}

export async function listSavedSearches(orgId: string, screenKey: string): Promise<SavedSearch[]> {
    const response = await authFetch(`/api/organizations/${orgId}/ui/saved-searches?screen_key=${encodeURIComponent(screenKey)}`)
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to list saved searches')
    }
    const data = await response.json()
    return data.items || []
}

export async function createSavedSearch(
    orgId: string,
    payload: { screen_key: string; name: string; filters_json: Record<string, unknown>; is_default?: boolean }
): Promise<SavedSearch> {
    const response = await authFetch(`/api/organizations/${orgId}/ui/saved-searches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to create saved search')
    }
    return response.json()
}

export async function updateSavedSearch(
    orgId: string,
    searchId: string,
    payload: { name?: string; filters_json?: Record<string, unknown>; is_default?: boolean; touch_last_used?: boolean }
): Promise<SavedSearch> {
    const response = await authFetch(`/api/organizations/${orgId}/ui/saved-searches/${searchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to update saved search')
    }
    return response.json()
}

export async function deleteSavedSearch(orgId: string, searchId: string) {
    const response = await authFetch(`/api/organizations/${orgId}/ui/saved-searches/${searchId}`, { method: 'DELETE' })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to delete saved search')
    }
    return response.json()
}

export async function heartbeatActiveScreen(
    orgId: string,
    payload: { session_id: string; route: string; screen_key?: string; title?: string }
): Promise<ActiveScreen> {
    const response = await authFetch(`/api/organizations/${orgId}/ui/active-screens/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to heartbeat active screen')
    }
    return response.json()
}

export async function listActiveScreens(orgId: string): Promise<ActiveScreen[]> {
    const response = await authFetch(`/api/organizations/${orgId}/ui/active-screens`)
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to list active screens')
    }
    const data = await response.json()
    return data.items || []
}

export async function closeActiveScreen(orgId: string, screenId: string) {
    const response = await authFetch(`/api/organizations/${orgId}/ui/active-screens/${screenId}`, { method: 'DELETE' })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to close active screen')
    }
    return response.json()
}

export async function searchMenuEntities(orgId: string, q: string): Promise<SearchMenuResult[]> {
    const response = await authFetch(`/api/organizations/${orgId}/search/menu?q=${encodeURIComponent(q)}`)
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed menu search')
    }
    const data = await response.json()
    return data.items || []
}

export async function searchOrganizational(
    orgId: string,
    q: string,
    entities = 'employees,org_units,positions,job_titles,job_grades'
): Promise<Record<string, OrganizationalSearchResult[]>> {
    const response = await authFetch(
        `/api/organizations/${orgId}/search/organizational?q=${encodeURIComponent(q)}&entities=${encodeURIComponent(entities)}`
    )
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed organizational search')
    }
    const data = await response.json()
    return data.groups || {}
}

export async function getRecentUpdates(orgId: string, days = 30, limit = 20) {
    const response = await authFetch(`/api/organizations/${orgId}/search/recent-updates?days=${days}&limit=${limit}`)
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed recent updates')
    }
    const data = await response.json()
    return data.items || []
}

async function getJson(url: string) {
    const response = await authFetch(url)
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Request failed')
    }
    return response.json()
}

async function sendJson(url: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown) {
    const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Request failed')
    }
    return response.json()
}

export async function getModuleEntitlements(orgId: string) {
    return getJson(`/api/organizations/${orgId}/modules/entitlements`)
}

export async function getModuleFlags(orgId: string) {
    return getJson(`/api/organizations/${orgId}/modules/flags`)
}

export async function upsertModuleFlag(orgId: string, moduleKey: string, body: Record<string, unknown>) {
    return sendJson(`/api/organizations/${orgId}/modules/flags/${moduleKey}`, 'PUT', body)
}

export async function upsertFeatureFlag(orgId: string, flagKey: string, body: Record<string, unknown>) {
    return sendJson(`/api/organizations/${orgId}/modules/features/${flagKey}`, 'PUT', body)
}

export async function listNotificationEvents(orgId: string) {
    return getJson(`/api/organizations/${orgId}/notifications/events`)
}

export async function createNotificationEvent(orgId: string, body: Record<string, unknown>) {
    return sendJson(`/api/organizations/${orgId}/notifications/events`, 'POST', body)
}

export async function dispatchNotificationEvent(orgId: string, eventId: string) {
    return sendJson(`/api/organizations/${orgId}/notifications/events/${eventId}/dispatch`, 'POST', {})
}
export async function dispatchPendingNotificationEvents(orgId: string, limit = 50) {
    return sendJson(`/api/organizations/${orgId}/notifications/events/dispatch-pending?limit=${limit}`, 'POST', {})
}
export async function retryNotificationDelivery(orgId: string, deliveryId: string) {
    return sendJson(`/api/organizations/${orgId}/notifications/deliveries/${deliveryId}/retry`, 'POST', {})
}

export async function listFlowCandidates(orgId: string) { return getJson(`/api/organizations/${orgId}/flow/candidates`) }
export async function createFlowCandidate(orgId: string, body: Record<string, unknown>) { return sendJson(`/api/organizations/${orgId}/flow/candidates`, 'POST', body) }
export async function updateFlowCandidate(orgId: string, candidateId: string, body: Record<string, unknown>) { return sendJson(`/api/organizations/${orgId}/flow/candidates/${candidateId}`, 'PUT', body) }
export async function transitionFlowCandidate(orgId: string, candidateId: string, stage: string, body: Record<string, unknown> = {}) {
    return sendJson(`/api/organizations/${orgId}/flow/candidates/${candidateId}/transition`, 'POST', { stage, ...body })
}
export async function listFlowWorkflows(orgId: string) { return getJson(`/api/organizations/${orgId}/flow/onboarding/workflows`) }
export async function createFlowWorkflow(orgId: string, body: Record<string, unknown>) { return sendJson(`/api/organizations/${orgId}/flow/onboarding/workflows`, 'POST', body) }
export async function transitionFlowWorkflow(orgId: string, workflowId: string, status: string) {
    return sendJson(`/api/organizations/${orgId}/flow/onboarding/workflows/${workflowId}/transition`, 'POST', { status })
}
export async function listFlowTasks(orgId: string) { return getJson(`/api/organizations/${orgId}/flow/onboarding/tasks`) }
export async function createFlowTask(orgId: string, body: Record<string, unknown>) { return sendJson(`/api/organizations/${orgId}/flow/onboarding/tasks`, 'POST', body) }
export async function updateFlowTask(orgId: string, taskId: string, body: Record<string, unknown>) {
    return sendJson(`/api/organizations/${orgId}/flow/onboarding/tasks/${taskId}`, 'PUT', body)
}
export async function listFlowContracts(orgId: string) { return getJson(`/api/organizations/${orgId}/flow/contracts`) }
export async function createFlowContract(orgId: string, body: Record<string, unknown>) { return sendJson(`/api/organizations/${orgId}/flow/contracts`, 'POST', body) }
export async function transitionFlowContract(orgId: string, contractId: string, status: string) {
    return sendJson(`/api/organizations/${orgId}/flow/contracts/${contractId}/transition`, 'POST', { status })
}
export async function sendFlowContractForSignature(orgId: string, contractId: string, body: Record<string, unknown>) {
    return sendJson(`/api/organizations/${orgId}/flow/contracts/${contractId}/send`, 'POST', body)
}

export async function listDocTemplates(orgId: string) { return getJson(`/api/organizations/${orgId}/docs/templates`) }
export async function createDocTemplate(orgId: string, body: Record<string, unknown>) { return sendJson(`/api/organizations/${orgId}/docs/templates`, 'POST', body) }
export async function listDocInstances(orgId: string) { return getJson(`/api/organizations/${orgId}/docs/instances`) }
export async function createDocInstance(orgId: string, body: Record<string, unknown>) { return sendJson(`/api/organizations/${orgId}/docs/instances`, 'POST', body) }
export async function renderDocInstance(orgId: string, instanceId: string) { return sendJson(`/api/organizations/${orgId}/docs/instances/${instanceId}/render`, 'POST', {}) }
export async function transitionDocInstance(orgId: string, instanceId: string, status: string) {
    return sendJson(`/api/organizations/${orgId}/docs/instances/${instanceId}/transition`, 'POST', { status })
}
export async function sendDocInstanceForSignature(orgId: string, instanceId: string, body: Record<string, unknown>) {
    return sendJson(`/api/organizations/${orgId}/docs/signatures/${instanceId}/send`, 'POST', body)
}

export async function getVisionLive(orgId: string) { return getJson(`/api/organizations/${orgId}/vision/org-chart/live`) }
export async function createVisionSnapshot(orgId: string, body: Record<string, unknown>) { return sendJson(`/api/organizations/${orgId}/vision/org-chart/snapshots`, 'POST', body) }
export async function getVisionGapAnalysis(orgId: string) { return getJson(`/api/organizations/${orgId}/vision/org-chart/gap-analysis`) }

export async function listAssetItems(orgId: string) { return getJson(`/api/organizations/${orgId}/assets/items`) }
export async function createAssetItem(orgId: string, body: Record<string, unknown>) { return sendJson(`/api/organizations/${orgId}/assets/items`, 'POST', body) }
export async function listAssetAssignments(orgId: string) { return getJson(`/api/organizations/${orgId}/assets/assignments`) }
export async function createAssetAssignment(orgId: string, body: Record<string, unknown>) { return sendJson(`/api/organizations/${orgId}/assets/assignments`, 'POST', body) }
export async function returnAssetAssignment(orgId: string, assignmentId: string, body: Record<string, unknown> = {}) {
    return sendJson(`/api/organizations/${orgId}/assets/assignments/${assignmentId}/return`, 'POST', body)
}
export async function listVehicles(orgId: string) { return getJson(`/api/organizations/${orgId}/assets/vehicles`) }
export async function createVehicle(orgId: string, body: Record<string, unknown>) { return sendJson(`/api/organizations/${orgId}/assets/vehicles`, 'POST', body) }
export async function getVehicleReminders(orgId: string) { return getJson(`/api/organizations/${orgId}/assets/vehicles/reminders`) }
export async function dispatchVehicleReminders(orgId: string) { return sendJson(`/api/organizations/${orgId}/assets/vehicles/reminders/dispatch`, 'POST', {}) }

export async function listVibePosts(orgId: string) { return getJson(`/api/organizations/${orgId}/vibe/portal/posts`) }
export async function createVibePost(orgId: string, body: Record<string, unknown>) { return sendJson(`/api/organizations/${orgId}/vibe/portal/posts`, 'POST', body) }
export async function listVibeEvents(orgId: string) { return getJson(`/api/organizations/${orgId}/vibe/events`) }
export async function createVibeEvent(orgId: string, body: Record<string, unknown>) { return sendJson(`/api/organizations/${orgId}/vibe/events`, 'POST', body) }
export async function listPulseSurveys(orgId: string) { return getJson(`/api/organizations/${orgId}/vibe/pulse/surveys`) }
export async function createPulseSurvey(orgId: string, body: Record<string, unknown>) { return sendJson(`/api/organizations/${orgId}/vibe/pulse/surveys`, 'POST', body) }
export async function transitionPulseSurvey(orgId: string, surveyId: string, status: string, body: Record<string, unknown> = {}) {
    return sendJson(`/api/organizations/${orgId}/vibe/pulse/surveys/${surveyId}/transition`, 'POST', { status, ...body })
}
export async function submitPulseResponse(orgId: string, surveyId: string, body: Record<string, unknown>) {
    return sendJson(`/api/organizations/${orgId}/vibe/pulse/surveys/${surveyId}/responses`, 'POST', body)
}

export async function listGrowReviewCycles(orgId: string) { return getJson(`/api/organizations/${orgId}/grow/review-cycles`) }
export async function createGrowReviewCycle(orgId: string, body: Record<string, unknown>) { return sendJson(`/api/organizations/${orgId}/grow/review-cycles`, 'POST', body) }
export async function transitionGrowReviewCycle(orgId: string, cycleId: string, status: string) {
    return sendJson(`/api/organizations/${orgId}/grow/review-cycles/${cycleId}/transition`, 'POST', { status })
}
export async function listGrowReviews(orgId: string) { return getJson(`/api/organizations/${orgId}/grow/reviews`) }
export async function createGrowReview(orgId: string, body: Record<string, unknown>) { return sendJson(`/api/organizations/${orgId}/grow/reviews`, 'POST', body) }
export async function updateGrowReview(orgId: string, reviewId: string, body: Record<string, unknown>) {
    return sendJson(`/api/organizations/${orgId}/grow/reviews/${reviewId}`, 'PUT', body)
}
export async function listGrowGoals(orgId: string) { return getJson(`/api/organizations/${orgId}/grow/goals`) }
export async function createGrowGoal(orgId: string, body: Record<string, unknown>) { return sendJson(`/api/organizations/${orgId}/grow/goals`, 'POST', body) }
export async function transitionGrowGoal(orgId: string, goalId: string, status: string) {
    return sendJson(`/api/organizations/${orgId}/grow/goals/${goalId}/transition`, 'POST', { status })
}
export async function createGrowGoalCheckin(orgId: string, goalId: string, body: Record<string, unknown>) {
    return sendJson(`/api/organizations/${orgId}/grow/goals/${goalId}/checkins`, 'POST', body)
}

export async function listInsightsKpis(orgId: string) { return getJson(`/api/organizations/${orgId}/insights/kpis`) }
export async function createInsightsKpi(orgId: string, body: Record<string, unknown>) { return sendJson(`/api/organizations/${orgId}/insights/kpis`, 'POST', body) }
export async function materializeInsightsKpiNow(orgId: string, kpiId: string) {
    return sendJson(`/api/organizations/${orgId}/insights/kpis/${kpiId}/materialize-now`, 'POST', {})
}
export async function listInsightsWidgets(orgId: string) { return getJson(`/api/organizations/${orgId}/insights/dashboards/widgets`) }
export async function createInsightsWidget(orgId: string, body: Record<string, unknown>) { return sendJson(`/api/organizations/${orgId}/insights/dashboards/widgets`, 'POST', body) }
export async function listInsightsReports(orgId: string) { return getJson(`/api/organizations/${orgId}/insights/reports`) }
export async function createInsightsReport(orgId: string, body: Record<string, unknown>) { return sendJson(`/api/organizations/${orgId}/insights/reports`, 'POST', body) }
export async function runInsightsReport(orgId: string, reportId: string, body: Record<string, unknown> = {}) {
    return sendJson(`/api/organizations/${orgId}/insights/reports/${reportId}/run`, 'POST', body)
}

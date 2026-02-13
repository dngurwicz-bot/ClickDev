import { closeActiveScreen, heartbeatActiveScreen, listActiveScreens } from '@/lib/api'

const SESSION_KEY = 'click_ui_session_id'

function getSessionId() {
    if (typeof window === 'undefined') return 'server-session'
    let id = localStorage.getItem(SESSION_KEY)
    if (!id) {
        id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
        localStorage.setItem(SESSION_KEY, id)
    }
    return id
}

export async function sendActiveScreenHeartbeat(orgId: string, route: string, screenKey?: string, title?: string) {
    return heartbeatActiveScreen(orgId, {
        session_id: getSessionId(),
        route,
        screen_key: screenKey,
        title,
    })
}

export async function fetchActiveScreens(orgId: string) {
    return listActiveScreens(orgId)
}

export async function removeActiveScreen(orgId: string, screenId: string) {
    return closeActiveScreen(orgId, screenId)
}

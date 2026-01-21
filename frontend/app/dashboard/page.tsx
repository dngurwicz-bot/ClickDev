'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
    Users,
    FileText,
    Workflow,
    Eye,
    Package,
    Heart,
    TrendingUp,
    BarChart3,
    Building2,
    Sparkles,
    Lock,
    Bell,
    AlertCircle,
    CheckCircle,
    Info,
    Megaphone
} from 'lucide-react'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

interface ModuleTile {
    id: string
    name: string
    nameEn: string
    icon: any
    color: string
    href: string
    description: string
}

interface Announcement {
    id: string
    title: string
    content: string
    type: string
    created_at: string
}

const ALL_MODULES: ModuleTile[] = [
    {
        id: 'core',
        name: 'ליבה',
        nameEn: 'Core',
        icon: Building2,
        color: 'from-blue-400 to-blue-600',
        href: '/dashboard/employees',
        description: 'ניהול עובדים ומשאבי אנוש'
    },
    {
        id: 'flow',
        name: 'Flow',
        nameEn: 'Flow',
        icon: Workflow,
        color: 'from-purple-400 to-purple-600',
        href: '/dashboard/flow',
        description: 'ניהול תהליכים ואוטומציה'
    },
    {
        id: 'docs',
        name: 'מסמכים',
        nameEn: 'Documents',
        icon: FileText,
        color: 'from-cyan-400 to-cyan-600',
        href: '/dashboard/documents',
        description: 'ניהול מסמכים וקבצים'
    },
    {
        id: 'vision',
        name: 'Vision',
        nameEn: 'Vision',
        icon: Eye,
        color: 'from-indigo-400 to-indigo-600',
        href: '/dashboard/vision',
        description: 'תרשים ארגוני אינטראקטיבי'
    },
    {
        id: 'assets',
        name: 'נכסים',
        nameEn: 'Assets',
        icon: Package,
        color: 'from-green-400 to-green-600',
        href: '/dashboard/assets',
        description: 'ניהול נכסים וציוד'
    },
    {
        id: 'vibe',
        name: 'Vibe',
        nameEn: 'Vibe',
        icon: Heart,
        color: 'from-pink-400 to-pink-600',
        href: '/dashboard/vibe',
        description: 'מדידת שביעות רצון ומעורבות'
    },
    {
        id: 'grow',
        name: 'Grow',
        nameEn: 'Grow',
        icon: TrendingUp,
        color: 'from-orange-400 to-orange-600',
        href: '/dashboard/grow',
        description: 'פיתוח והדרכת עובדים'
    },
    {
        id: 'insights',
        name: 'Insights',
        nameEn: 'Insights',
        icon: BarChart3,
        color: 'from-teal-400 to-teal-600',
        href: '/dashboard/insights',
        description: 'דוחות וניתוחים מתקדמים'
    },
]

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const { currentOrg, isLoading: orgLoading } = useOrganization()
    const router = useRouter()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            setLoading(false)
        }
        getUser()
    }, [router])

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                const response = await fetch('/api/announcements', {
                    headers: {
                        'Authorization': `Bearer ${session?.access_token}`
                    }
                })
                if (response.ok) {
                    const data = await response.json()
                    setAnnouncements(data)
                }
            } catch (error) {
                console.error('Error fetching announcements:', error)
            }
        }

        if (!loading && user) {
            fetchAnnouncements()
        }
    }, [loading, user])

    if (loading || orgLoading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="h-24 bg-gray-200 rounded-xl"></div>
                        <div className="h-24 bg-gray-200 rounded-xl"></div>
                        <div className="h-24 bg-gray-200 rounded-xl"></div>
                        <div className="h-24 bg-gray-200 rounded-xl"></div>
                    </div>
                </div>
            </div>
        )
    }

    // Check if module is active
    const isModuleActive = (moduleId: string) => {
        return moduleId === 'core' || currentOrg?.active_modules?.includes(moduleId)
    }

    // Split into core and advanced modules
    const coreModules = ALL_MODULES.filter(m => ['core', 'flow', 'docs'].includes(m.id))
    const advancedModules = ALL_MODULES.filter(m => !['core', 'flow', 'docs'].includes(m.id))

    const getAnnouncementIcon = (type: string) => {
        switch (type) {
            case 'warning': return AlertCircle
            case 'success': return CheckCircle
            case 'update': return Megaphone
            default: return Info
        }
    }

    const getAnnouncementColor = (type: string) => {
        switch (type) {
            case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
            case 'success': return 'bg-green-50 border-green-200 text-green-800'
            case 'update': return 'bg-purple-50 border-purple-200 text-purple-800'
            default: return 'bg-blue-50 border-blue-200 text-blue-800'
        }
    }

    const renderModuleTile = (module: ModuleTile) => {
        const Icon = module.icon
        const isActive = isModuleActive(module.id)

        return (
            <button
                key={module.id}
                onClick={() => isActive && router.push(module.href)}
                disabled={!isActive}
                className={`group relative bg-white rounded-xl shadow-sm transition-all duration-300 p-4 text-center overflow-hidden ${isActive
                        ? 'hover:shadow-lg transform hover:-translate-y-1 cursor-pointer'
                        : 'opacity-60 cursor-not-allowed'
                    }`}
            >
                {isActive && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                )}

                {!isActive && (
                    <div className="absolute top-2 left-2 bg-gray-100 rounded-full p-1">
                        <Lock className="w-3 h-3 text-gray-400" />
                    </div>
                )}

                <div className={`relative mx-auto w-12 h-12 rounded-xl bg-gradient-to-br ${isActive ? module.color : 'from-gray-300 to-gray-400'
                    } flex items-center justify-center mb-2 ${isActive ? 'group-hover:scale-110' : ''
                    } transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className={`relative text-sm font-bold mb-1 ${isActive ? 'text-text-primary' : 'text-gray-400'
                    }`}>{module.name}</h3>
                <p className={`relative text-xs ${isActive ? 'text-text-secondary' : 'text-gray-400'
                    }`}>{module.nameEn}</p>
            </button>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 flex gap-6">
            {/* Announcements Sidebar */}
            <div className="w-80 flex-shrink-0">
                <div className="bg-white rounded-xl shadow-sm p-4 sticky top-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Bell className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-bold text-text-primary">הודעות ועדכונים</h2>
                    </div>

                    <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                        {announcements.length === 0 ? (
                            <div className="text-center py-8 text-text-muted">
                                <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">אין הודעות חדשות</p>
                            </div>
                        ) : (
                            announcements.map((announcement) => {
                                const Icon = getAnnouncementIcon(announcement.type)
                                const colorClass = getAnnouncementColor(announcement.type)

                                return (
                                    <div
                                        key={announcement.id}
                                        className={`p-3 rounded-lg border ${colorClass}`}
                                    >
                                        <div className="flex items-start gap-2 mb-2">
                                            <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <h3 className="font-semibold text-sm">{announcement.title}</h3>
                                        </div>
                                        <p className="text-xs opacity-90 mb-2">{announcement.content}</p>
                                        <p className="text-xs opacity-60">
                                            {new Date(announcement.created_at).toLocaleDateString('he-IL')}
                                        </p>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-text-primary mb-1">
                            שלום, {user?.user_metadata?.first_name || 'משתמש'} 👋
                        </h1>
                        <p className="text-text-secondary">
                            ברוכים הבאים למערכת CLICK
                            {currentOrg && <span className="font-semibold text-primary"> - {currentOrg.name}</span>}
                        </p>
                    </div>

                    {/* Core Modules Section */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-bold text-text-primary">מודולי ליבה</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {coreModules.map(renderModuleTile)}
                        </div>
                    </div>

                    {/* Advanced Modules Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Package className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-bold text-text-primary">מודולים מתקדמים</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {advancedModules.map(renderModuleTile)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

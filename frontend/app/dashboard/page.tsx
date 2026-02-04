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
    Settings,
    MoreHorizontal,
    Plus,
    BarChart,
    ChevronDown,
    List,
    Lock
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

const ALL_MODULES: ModuleTile[] = [
    {
        id: 'core',
        name: 'ליבה',
        nameEn: 'Core',
        icon: Building2,
        color: 'text-blue-600',
        href: '/dashboard/core',
        description: 'ניהול עובדים ומשאבי אנוש'
    },
    {
        id: 'flow',
        name: 'Flow',
        nameEn: 'Flow',
        icon: Workflow,
        color: 'text-purple-600',
        href: '/dashboard/flow',
        description: 'ניהול תהליכים ואוטומציה'
    },
    {
        id: 'docs',
        name: 'מסמכים',
        nameEn: 'Documents',
        icon: FileText,
        color: 'text-cyan-600',
        href: '/dashboard/documents',
        description: 'ניהול מסמכים וקבצים'
    },
    {
        id: 'vision',
        name: 'Vision',
        nameEn: 'Vision',
        icon: Eye,
        color: 'text-indigo-600',
        href: '/dashboard/vision',
        description: 'תרשים ארגוני אינטראקטיבי'
    },
    {
        id: 'assets',
        name: 'נכסים',
        nameEn: 'Assets',
        icon: Package,
        color: 'text-green-600',
        href: '/dashboard/assets',
        description: 'ניהול נכסים וציוד'
    },
    {
        id: 'vibe',
        name: 'Vibe',
        nameEn: 'Vibe',
        icon: Heart,
        color: 'text-pink-600',
        href: '/dashboard/vibe',
        description: 'מדידת שביעות רצון ומעורבות'
    },
    {
        id: 'grow',
        name: 'Grow',
        nameEn: 'Grow',
        icon: TrendingUp,
        color: 'text-orange-600',
        href: '/dashboard/grow',
        description: 'פיתוח והדרכת עובדים'
    },
    {
        id: 'insights',
        name: 'Insights',
        nameEn: 'Insights',
        icon: BarChart3,
        color: 'text-teal-600',
        href: '/dashboard/insights',
        description: 'דוחות וניתוחים מתקדמים'
    },
]

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const { currentOrg } = useOrganization()
    const router = useRouter()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            setLoading(false)
        }
        getUser()
    }, [router])

    if (loading) {
        return <div className="p-8 text-center text-slate-500">טוען...</div>
    }

    // Check if module is active
    const isModuleActive = (moduleId: string) => {
        return moduleId === 'core' || currentOrg?.active_modules?.includes(moduleId)
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-8">
            {/* Header Greeting */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-light text-slate-800">
                    ערב טוב, {user?.user_metadata?.first_name || 'משתמש'}
                </h1>
            </div>

            <div className="text-slate-500 text-sm">
                בחר מודול מהתפריט העליון כדי להתחיל לעבוד.
            </div>
        </div>
    )
}

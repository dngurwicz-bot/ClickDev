'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    User, Mail, Building2, Shield, Calendar, Clock,
    ArrowRight, Save, Trash2, Key, AlertTriangle, CheckCircle2, Plus, X, Star
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import ActivityLog from '@/components/admin/ActivityLog'
import GlobalLoader from '@/components/ui/GlobalLoader'

interface UserData {
    id: string
    email: string
    created_at: string
    last_sign_in_at: string
    role: string
    organization_name: string
    organization_id: string
    user_metadata: any
}

interface UserOrganization {
    organization_id: string
    organization_name: string
    role: string
    is_primary: boolean
}

interface Organization {
    id: string
    name: string
}

export default function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    // Note: params is a Promise in Next.js 15+ for Server Components, 
    // but this is a Client Component ('use client'). 
    // Actually, in Next.js 15 (app dir), params is async even in client components if passed from layout? 
    // Let's assume standard behavior: we need to await it or use `use` hook if available, 
    // or just treat it as a prop that might need resolving if types say so.
    // Given the previous file `api/users/[id]/route.ts` treated it as `await params`, 
    // let's handle it safely. 

    const [userId, setUserId] = useState<string>('')
    const [user, setUser] = useState<UserData | null>(null)
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [userOrganizations, setUserOrganizations] = useState<UserOrganization[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showAddOrgModal, setShowAddOrgModal] = useState(false)
    const router = useRouter()

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        role: 'user',
        organization_id: ''
    })

    const [addOrgData, setAddOrgData] = useState({
        organization_id: '',
        role: 'user',
        is_primary: false
    })

    useEffect(() => {
        const resolveParams = async () => {
            const { id } = await params
            setUserId(id)
        }
        resolveParams()
    }, [params])

    useEffect(() => {
        if (!userId) return

        const fetchData = async () => {
            try {
                // Fetch User
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) return


                const [userRes, orgsRes] = await Promise.all([
                    fetch(`/api/users/${userId}`, {
                        headers: { Authorization: `Bearer ${session.access_token}` }
                    }),
                    fetch('/api/organizations', {
                        headers: { Authorization: `Bearer ${session.access_token}` }
                    })
                ])

                if (!userRes.ok) {
                    console.error('User fetch failed:', userRes.status, await userRes.text())
                    toast.error('שגיאה בטעינת פרטי משתמש')
                    setLoading(false)
                    return
                }

                if (!orgsRes.ok) {
                    console.error('Orgs fetch failed:', orgsRes.status)
                }

                const userData = await userRes.json()
                console.log('Fetched user data:', userData)
                console.log('user_metadata:', userData.user_metadata)
                console.log('first_name:', userData.user_metadata?.first_name)
                console.log('last_name:', userData.user_metadata?.last_name)

                if (userData) {
                    setUser(userData)
                    setFormData({
                        first_name: userData.user_metadata?.first_name || '',
                        last_name: userData.user_metadata?.last_name || '',
                        role: mapRoleToValue(userData.role),
                        organization_id: userData.organization_id ? String(userData.organization_id) : ''
                    })
                    console.log('Form data set:', {
                        first_name: userData.user_metadata?.first_name || '',
                        last_name: userData.user_metadata?.last_name || '',
                        organization_id: userData.organization_id,
                        role: userData.role
                    })
                }


                if (orgsRes.ok) {
                    const orgsData = await orgsRes.json()
                    console.log('Organizations loaded:', orgsData)
                    setOrganizations(orgsData)
                } else {
                    console.error('Failed to load organizations')
                }
            } catch (error) {
                console.error('Error in fetchData:', error)
                toast.error('שגיאה בטעינת נתונים')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [userId])

    const mapRoleToValue = (displayRole: string) => {
        if (displayRole === 'System Admin' || displayRole === 'Super Admin') return 'super_admin' // Handle generic display
        if (displayRole === 'organization_admin' || displayRole === 'Org Admin') return 'organization_admin'
        return 'user'
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const response = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    role: formData.role,
                    organization_id: formData.organization_id
                })
            })

            if (!response.ok) throw new Error('Failed')

            toast.success('השינויים נשמרו בהצלחה')
            // Refresh logic?
        } catch (error) {
            toast.error('שגיאה בשמירת השינויים')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <GlobalLoader />
    if (!user) return <div className="p-8 text-center text-gray-500">משתמש לא נמצא</div>

    return (
        <div className="min-h-screen bg-gray-50/50" dir="rtl">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/users" className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-0.5">
                                <span>ניהול משתמשים</span>
                                <span>/</span>
                                <span>{formData.first_name} {formData.last_name}</span>
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">פרטי משתמש</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors">
                            <Trash2 className="w-4 h-4" />
                            <span>מחק משתמש</span>
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark shadow-sm hover:shadow transition-all font-medium text-sm disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'שומר...' : 'שמור שינויים'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Profile & Info */}
                    <div className="space-y-6">
                        {/* Profile Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold mb-4">
                                    {(user.user_metadata?.first_name?.[0]) || user.email[0]?.toUpperCase()}
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-1">
                                    {formData.first_name} {formData.last_name}
                                </h2>
                                <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                                    <Mail className="w-4 h-4" />
                                    {user.email}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${user.last_sign_in_at ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                    }`}>
                                    {user.last_sign_in_at ? 'פעיל' : 'ממתין להפעלה'}
                                </div>
                            </div>

                            <div className="mt-8 space-y-4 border-t border-gray-100 pt-6">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        נוצר בתאריך
                                    </span>
                                    <span className="font-medium">{new Date(user.created_at).toLocaleDateString('he-IL')}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        כניסה אחרונה
                                    </span>
                                    <span className="font-medium">
                                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('he-IL') : '-'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
                                    <Key className="w-4 h-4" />
                                    אפס סיסמה
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Middle Column: Edit Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Settings Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">פרטים אישיים</h3>
                                    <p className="text-sm text-gray-500">ערוך את פרטי המשתמש והרשאות הגישה</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">שם פרטי</label>
                                    <input
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        value={formData.first_name}
                                        onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">שם משפחה</label>
                                    <input
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        value={formData.last_name}
                                        onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">אימייל</label>
                                    <input
                                        disabled
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                                        value={user.email}
                                    />
                                </div>
                            </div>

                            <hr className="my-8 border-gray-100" />

                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">הרשאות וארגון</h3>
                                    <p className="text-sm text-gray-500">הגדרת רמת הגישה ושיוך ארגוני</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">תפקיד במערכת</label>
                                    <select
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="user">משתמש רגיל (User)</option>
                                        <option value="organization_admin">מנהל ארגון (Org Admin)</option>
                                        <option value="super_admin">מנהל מערכת (Super Admin)</option>
                                    </select>
                                </div>
                                {formData.role !== 'super_admin' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">ארגון משויך</label>
                                        <select
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none"
                                            value={formData.organization_id}
                                            onChange={e => setFormData({ ...formData, organization_id: e.target.value })}
                                        >
                                            <option value="">בחר ארגון...</option>
                                            {organizations.map(org => (
                                                <option key={org.id} value={org.id}>{org.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Activity Log - Now Expanded */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">היסטוריית פעולות</h3>
                                    <p className="text-sm text-gray-500">תיעוד פעולות שבוצעו על ידי המשתמש</p>
                                </div>
                            </div>

                            <div className="h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                <ActivityLog userId={userId} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

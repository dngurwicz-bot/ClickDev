import { StatsCard } from '@/components/admin/StatsCard'
import { 
  Building2, 
  Users, 
  DollarSign, 
  Activity,
  Plus,
  UserPlus,
  FileText,
  Settings,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp
} from 'lucide-react'
import { getAllOrganizations } from '@/lib/api/organizations'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

export default async function DashboardPage() {
  const { data: organizations } = await getAllOrganizations()
  const supabase = await createClient()
  
  // Get total employees count
  const { count: totalEmployees } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
  
  // Get users count (from user_roles, not profiles, because profiles might include deleted users)
  const { count: totalUsers } = await supabase
    .from('user_roles')
    .select('*', { count: 'exact', head: true })
  
  // Get active organizations count
  const activeOrgs = organizations?.filter(org => org.is_active && org.status === 'active').length || 0
  
  // Get total organizations count
  const totalOrgs = organizations?.length || 0

  // Quick actions
  const quickActions = [
    { 
      title: 'ארגון חדש', 
      description: 'הקם ארגון חדש במערכת',
      href: '/admin/organizations/new', 
      icon: Building2,
      color: 'bg-primary text-white hover:bg-primary-dark'
    },
    { 
      title: 'משתמש חדש', 
      description: 'הוסף משתמש או Super Admin',
      href: '/admin/users/new', 
      icon: UserPlus,
      color: 'bg-blue-600 text-white hover:bg-blue-700'
    },
    { 
      title: 'דוחות', 
      description: 'צפה בדוחות ואנליטיקה',
      href: '/admin/analytics', 
      icon: FileText,
      color: 'bg-purple-600 text-white hover:bg-purple-700'
    },
    { 
      title: 'הגדרות', 
      description: 'נהל הגדרות מערכת',
      href: '/admin/settings', 
      icon: Settings,
      color: 'bg-gray-700 text-white hover:bg-gray-800'
    },
  ]

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">לוח בקרה</h1>
            <p className="text-sm text-text-secondary">סקירה כללית של מערכת CLICK</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="סה״כ ארגונים"
          value={totalOrgs}
          icon={Building2}
          color="primary"
          subtitle="ארגונים רשומים במערכת"
        />
        <StatsCard
          title="ארגונים פעילים"
          value={activeOrgs}
          icon={CheckCircle2}
          color="success"
          subtitle="עם מנוי פעיל"
        />
        <StatsCard
          title="סה״כ משתמשים"
          value={totalUsers || 0}
          icon={Users}
          color="info"
          subtitle="משתמשים רשומים במערכת"
        />
        <StatsCard
          title="סה״כ עובדים"
          value={totalEmployees || 0}
          icon={Users}
          color="info"
          subtitle="עובדים רשומים בכל הארגונים"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">פעולות מהירות</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`
                  group flex items-center gap-4 rounded-xl p-4 transition-all
                  ${action.color}
                `}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm opacity-80 truncate">{action.description}</div>
                </div>
                <ArrowUpRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            )
          })}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Organizations */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <h2 className="font-semibold text-text-primary">ארגונים אחרונים</h2>
            </div>
            <Link 
              href="/admin/organizations"
              className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1"
            >
              הצג הכל
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          
          {organizations && organizations.length > 0 ? (
            <div className="space-y-3">
              {organizations.slice(0, 5).map((org) => (
                <Link
                  key={org.id}
                  href={`/admin/organizations/${org.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 group-hover:bg-primary/10 transition-colors">
                      <Building2 className="h-5 w-5 text-gray-500 group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary group-hover:text-primary transition-colors">
                        {org.name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {org.org_number && `#${org.org_number} • `}
                        {format(new Date(org.created_at), 'dd MMM yyyy', { locale: he })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`
                      rounded-full px-2.5 py-1 text-xs font-medium
                      ${org.status === 'active' && org.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-600'}
                    `}>
                      {org.status === 'active' && org.is_active ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Building2 className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-text-secondary mb-4">אין ארגונים עדיין</p>
              <Link
                href="/admin/organizations/new"
                className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium"
              >
                <Plus className="h-4 w-4" />
                צור ארגון ראשון
              </Link>
            </div>
          )}
        </div>

        {/* System Status / Activity */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                <Activity className="h-4 w-4 text-emerald-600" />
              </div>
              <h2 className="font-semibold text-text-primary">סטטוס מערכת</h2>
            </div>
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              פעיל
            </span>
          </div>
          
          <div className="space-y-4">
            {/* System Health Items */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium text-text-primary">שרת API</span>
              </div>
              <span className="text-xs text-emerald-600 font-medium">תקין</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium text-text-primary">מסד נתונים</span>
              </div>
              <span className="text-xs text-emerald-600 font-medium">תקין</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium text-text-primary">אימות משתמשים</span>
              </div>
              <span className="text-xs text-emerald-600 font-medium">תקין</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-text-primary">עדכון אחרון</span>
              </div>
              <span className="text-xs text-text-secondary">
                {format(new Date(), 'HH:mm • dd/MM/yyyy', { locale: he })}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-text-primary">{totalOrgs}</div>
                <div className="text-xs text-text-muted">ארגונים</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">{totalUsers || 0}</div>
                <div className="text-xs text-text-muted">משתמשים</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">{totalEmployees || 0}</div>
                <div className="text-xs text-text-muted">עובדים</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

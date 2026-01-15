import { createClient } from '@/utils/supabase/server'
import { 
  Building2, 
  Users, 
  Settings, 
  Package,
  ArrowRight,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Globe,
  Hash,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  Briefcase,
  CreditCard,
  Building,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { OrganizationActions } from '@/components/admin/OrganizationActions'
import { ResendPasswordEmail } from '@/components/admin/ResendPasswordEmail'

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient()
  
  // Get organization with all details
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single()

  // Get employees count
  const { count: employeesCount } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', id)

  // Get organization modules
  const { data: allModules } = await supabase
    .from('system_modules')
    .select('*')
    .order('is_core', { ascending: false })

  // Get organization admin user
  const { data: adminRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('organization_id', id)
    .eq('role', 'organization_admin')
    .limit(1)

  let adminEmail: string | null = null
  let adminFullName: string | null = null
  if (adminRoles && adminRoles.length > 0) {
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('email, first_name, last_name, full_name')
      .eq('id', adminRoles[0].user_id)
      .single()
    
    adminEmail = adminProfile?.email || null
    adminFullName = adminProfile?.full_name || 
      (adminProfile?.first_name && adminProfile?.last_name 
        ? `${adminProfile.first_name} ${adminProfile.last_name}` 
        : adminProfile?.first_name || adminProfile?.last_name || null)
  }

  // Fallback: if no admin role found, try to find by auth.users
  if (!adminEmail) {
    // Try to get from auth.users directly (requires service role, so we'll use a different approach)
    // For now, we'll show the component anyway with a note
  }

  if (orgError || !organization) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          שגיאה בטעינת הארגון: {orgError?.message || 'ארגון לא נמצא'}
        </div>
      </div>
    )
  }

  const activeModules = organization.active_modules || []
  const orgModules = allModules?.filter(m => activeModules.includes(m.id)) || []

  const statusColors: Record<string, { bg: string, text: string, label: string }> = {
    active: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'פעיל' },
    suspended: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'מושהה' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'מבוטל' },
  }

  const status = statusColors[organization.status] || statusColors.active

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/organizations"
          className="mb-4 inline-flex items-center gap-2 text-primary hover:text-primary-dark"
        >
          <ArrowRight className="h-4 w-4" />
          חזור לרשימת הארגונים
        </Link>
        
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            {/* Organization Avatar */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
      </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-text-primary">{organization.name}</h1>
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${status.bg} ${status.text}`}>
                  {status.label}
                </span>
              </div>
              {organization.org_number && (
                <p className="mt-1 text-text-secondary">מספר ארגון: #{organization.org_number}</p>
              )}
              {organization.email && (
                <p className="text-text-muted text-sm">{organization.email}</p>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href={`/admin/organizations/${id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-text-primary hover:bg-gray-50"
            >
              <Edit className="h-4 w-4" />
              עריכה
            </Link>
            <OrganizationActions organizationId={id} organizationName={organization.name} />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{employeesCount || 0}</p>
              <p className="text-sm text-text-secondary">עובדים</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{orgModules.length}</p>
              <p className="text-sm text-text-secondary">מודולים פעילים</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <CreditCard className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary capitalize">{organization.subscription_tier || 'basic'}</p>
              <p className="text-sm text-text-secondary">סוג מנוי</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">
                {format(new Date(organization.created_at), 'dd/MM/yy')}
              </p>
              <p className="text-sm text-text-secondary">תאריך הקמה</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Details */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">פרטי עסק</h2>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-text-muted flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  ח"פ (מספר חברה)
                </p>
                <p className="font-medium text-text-primary text-lg">
                  {organization.company_number || <span className="text-text-muted">לא הוזן</span>}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-text-muted flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  מספר עוסק מורשה
                </p>
                <p className="font-medium text-text-primary text-lg">
                  {organization.tax_id || <span className="text-text-muted">לא הוזן</span>}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-text-muted flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  תחום פעילות
                </p>
                <p className="font-medium text-text-primary">
                  {organization.industry || <span className="text-text-muted">לא הוזן</span>}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-text-muted flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  שם באנגלית
                </p>
                <p className="font-medium text-text-primary">
                  {organization.name_en || <span className="text-text-muted">לא הוזן</span>}
                </p>
              </div>
            </div>
            
            {organization.description && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-sm text-text-muted mb-2">תיאור</p>
                <p className="text-text-primary">{organization.description}</p>
              </div>
            )}
          </div>

          {/* Contact Details */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">פרטי קשר</h2>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-text-muted flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  אימייל
                </p>
                <p className="font-medium text-text-primary">
                  {organization.email || <span className="text-text-muted">לא הוזן</span>}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-text-muted flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  טלפון
                </p>
                <p className="font-medium text-text-primary" dir="ltr">
                  {organization.phone || <span className="text-text-muted">לא הוזן</span>}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-text-muted flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  עיר
                </p>
                <p className="font-medium text-text-primary">
                  {organization.city || <span className="text-text-muted">לא הוזן</span>}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-text-muted flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  אתר אינטרנט
                </p>
                {organization.website ? (
                  <a 
                    href={organization.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:text-primary-dark"
                    dir="ltr"
                  >
                    {organization.website}
                  </a>
                ) : (
                  <p className="text-text-muted">לא הוזן</p>
                )}
        </div>

              {organization.address && (
                <div className="sm:col-span-2 space-y-1">
                  <p className="text-sm text-text-muted flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    כתובת מלאה
                  </p>
                  <p className="font-medium text-text-primary">{organization.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Employees Preview */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <h2 className="text-lg font-semibold text-text-primary">עובדים ({employeesCount || 0})</h2>
              </div>
              <Link
                href={`/admin/organizations/${id}/employees`}
                className="text-sm text-primary hover:text-primary-dark font-medium"
              >
                צפה בכל העובדים →
              </Link>
            </div>
            
            {employeesCount && employeesCount > 0 ? (
              <p className="text-text-secondary">לארגון זה {employeesCount} עובדים רשומים במערכת.</p>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <Users className="h-6 w-6 text-gray-400" />
                        </div>
                <p className="text-text-secondary mb-4">אין עובדים רשומים לארגון זה</p>
                        <Link
                  href={`/admin/organizations/${id}/employees/new`}
                  className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium"
                        >
                  הוסף עובד ראשון
                        </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Active Modules */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">מודולים פעילים</h2>
            </div>
            
            <div className="space-y-3">
              {orgModules.length > 0 ? (
                orgModules.map((module) => (
                  <div 
                    key={module.id}
                    className={`
                      flex items-center gap-3 rounded-lg p-3
                      ${module.is_core ? 'bg-primary/5 border border-primary/20' : 'bg-gray-50'}
                    `}
                  >
                    <CheckCircle2 className={`h-5 w-5 ${module.is_core ? 'text-primary' : 'text-emerald-500'}`} />
                    <div>
                      <p className="font-medium text-text-primary text-sm">{module.name}</p>
                      {module.tag && (
                        <p className="text-xs text-text-muted">{module.tag}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-text-secondary text-center py-4">אין מודולים פעילים</p>
              )}
            </div>
          </div>

          {/* Organization Admin */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">מנהל הארגון</h2>
            </div>
            
            <div className="space-y-4">
              {adminEmail ? (
                <>
                  {adminFullName && (
                    <div>
                      <p className="text-sm text-text-muted mb-1">שם מלא</p>
                      <p className="font-medium text-text-primary text-lg">
                        {adminFullName}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-text-muted mb-1">אימייל</p>
                    <p className="font-medium text-text-primary" dir="ltr">
                      {adminEmail}
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm text-text-muted mb-2">שליחת מייל לאיפוס סיסמה</p>
                    <ResendPasswordEmail 
                      userEmail={adminEmail}
                      organizationId={id}
                      organizationName={organization.name}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <p className="text-sm text-amber-800 mb-3">
                      ⚠️ לא נמצא מנהל ארגון רשום במערכת
                    </p>
                    <p className="text-xs text-amber-700 mb-4">
                      אם יצרת ארגון עם מנהל, ייתכן שהתפקיד לא נוצר. ניתן לשלוח מייל לאימייל הארגון:
                    </p>
                    <div className="mb-4">
                      <p className="text-sm text-text-muted mb-1">אימייל ארגון</p>
                      <p className="font-medium text-text-primary" dir="ltr">
                        {organization.email}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-amber-200">
                      <p className="text-sm text-text-muted mb-2">שליחת מייל לאיפוס סיסמה</p>
                      <ResendPasswordEmail 
                        userEmail={organization.email}
                        organizationId={id}
                        organizationName={organization.name}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* System Info */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">מידע מערכת</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-text-muted">מזהה ארגון</p>
                <p className="font-mono text-xs text-text-secondary break-all">{organization.id}</p>
              </div>
              
              {organization.org_number && (
                <div>
                  <p className="text-sm text-text-muted">מספר ארגון</p>
                  <p className="font-medium text-text-primary">#{organization.org_number}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-text-muted">תאריך יצירה</p>
                <p className="font-medium text-text-primary">
                  {format(new Date(organization.created_at), 'dd MMMM yyyy, HH:mm', { locale: he })}
                </p>
              </div>
              
              {organization.updated_at && (
                <div>
                  <p className="text-sm text-text-muted">עדכון אחרון</p>
                  <p className="font-medium text-text-primary">
                    {format(new Date(organization.updated_at), 'dd MMMM yyyy, HH:mm', { locale: he })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

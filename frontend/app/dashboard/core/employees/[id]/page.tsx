'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { format, formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import {
    User, Mail, Phone, MapPin, Calendar, Briefcase,
    Building2, Hash, CreditCard, Download, Upload,
    Edit, Trash2, ArrowRight, Shield, Activity,
    FileText, CheckCircle, Smartphone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { toast } from 'react-hot-toast'
import { Modal } from '@/components/ui/modal'
import { EmployeeForm } from '@/components/core/EmployeeForm'

export default function EmployeeProfilePage() {
    const params = useParams()
    const router = useRouter()
    const { currentOrg } = useOrganization()
    const [employee, setEmployee] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    const fetchEmployee = async () => {
        if (!currentOrg || !params.id) return
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('id', params.id)
                .single()

            if (error) throw error
            setEmployee(data)
        } catch (err) {
            console.error('Error fetching employee:', err)
            toast.error('שגיאה בטעינת פרטי עובד')
            router.push('/dashboard/core/employees')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchEmployee() }, [currentOrg, params.id])

    const getTenure = (hireDate: string) => {
        if (!hireDate) return ''
        return formatDistanceToNow(new Date(hireDate), { locale: he, addSuffix: false })
    }

    const getInitials = (first: string, last: string) => {
        return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase()
    }

    if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
    if (!employee) return <div className="p-8">לא נמצא עובד</div>

    return (
        <div className="min-h-screen bg-gray-50/50" dir="rtl">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-4 mb-4">
                        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">
                            <ArrowRight className="w-4 h-4 ml-1" />
                            חזרה לרשימה
                        </Button>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                                <AvatarImage src={`https://ui-avatars.com/api/?name=${employee.first_name}+${employee.last_name}&background=00A896&color=fff`} />
                                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                                    {getInitials(employee.first_name, employee.last_name)}
                                </AvatarFallback>
                            </Avatar>

                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {employee.first_name} {employee.last_name}
                                </h1>
                                <div className="flex items-center gap-3 mt-2 text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Briefcase className="w-4 h-4" />
                                        <span>{employee.job_title}</span>
                                    </div>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                    <div className="flex items-center gap-1">
                                        <Hash className="w-4 h-4" />
                                        <span>עובד מס' {employee.employee_number || '---'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
                                <Edit className="w-4 h-4 ml-2" />
                                ערוך פרטים
                            </Button>
                            <Button variant="destructive">
                                <Trash2 className="w-4 h-4 ml-2" />
                                מחק עובד
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="bg-white p-1 shadow-sm border border-gray-200 rounded-xl">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">סקירה כללית</TabsTrigger>
                        <TabsTrigger value="personal" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">פרטים אישיים</TabsTrigger>
                        <TabsTrigger value="employment" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">העסקה ושכר</TabsTrigger>
                        <TabsTrigger value="documents" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">מסמכים</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Key Stats */}
                            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-blue-100">
                                    <div className="text-blue-600 mb-2"><Activity className="w-5 h-5" /></div>
                                    <div className="text-2xl font-bold text-gray-900">{getTenure(employee.hire_date)}</div>
                                    <div className="text-xs text-gray-500">ותק בחברה</div>
                                </Card>
                                <Card className="p-4 bg-gradient-to-br from-green-50 to-white border-green-100">
                                    <div className="text-green-600 mb-2"><Briefcase className="w-5 h-5" /></div>
                                    <div className="text-2xl font-bold text-gray-900">משרה מלאה</div>
                                    <div className="text-xs text-gray-500">היקף משרה</div>
                                </Card>
                                <Card className="p-4 bg-gradient-to-br from-purple-50 to-white border-purple-100">
                                    <div className="text-purple-600 mb-2"><Shield className="w-5 h-5" /></div>
                                    <div className="text-2xl font-bold text-gray-900">פעיל</div>
                                    <div className="text-xs text-gray-500">סטטוס</div>
                                </Card>
                            </div>

                            {/* Contact Card */}
                            <Card className="p-6 md:row-span-2 h-full">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary" />
                                    פרטי התקשרות
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs">אימייל</p>
                                            <p className="font-medium">{employee.email || '---'}</p>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                            <Smartphone className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs">נייד</p>
                                            <p className="font-medium">{employee.mobile || '---'}</p>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs">טלפון</p>
                                            <p className="font-medium">{employee.phone || '---'}</p>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs">כתובת</p>
                                            <p className="font-medium">{employee.address}, {employee.city || ''}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Additional Info Box */}
                            <Card className="p-6 md:col-span-2">
                                <h3 className="font-bold text-lg mb-4">פרטים נוספים</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">תאריך לידה</p>
                                        <p className="font-medium">{employee.birth_date ? format(new Date(employee.birth_date), 'dd/MM/yyyy') : '---'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">מגדר</p>
                                        <p className="font-medium">{employee.gender === 'male' ? 'זכר' : employee.gender === 'female' ? 'נקבה' : 'אחר'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">שם באנגלית</p>
                                        <p className="font-medium">{employee.first_name_en} {employee.last_name_en}</p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Personal Tab */}
                    <TabsContent value="personal">
                        <Card className="p-6">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <User className="w-6 h-6 text-primary" />
                                מידע אישי מורחב
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">מספר זהות</label>
                                    <div className="p-3 bg-gray-50 rounded-lg font-mono text-gray-700">{employee.id_number}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">מצב משפחתי</label>
                                    <div className="p-3 bg-gray-50 rounded-lg text-gray-700">נשוי + 2 (דוגמה)</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">ארץ לידה</label>
                                    <div className="p-3 bg-gray-50 rounded-lg text-gray-700">ישראל</div>
                                </div>
                            </div>

                            <Separator className="my-8" />

                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <CreditCard className="w-6 h-6 text-primary" />
                                פרטי חשבון בנק
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                                    <p className="text-xs text-gray-500 mb-1">שם הבנק</p>
                                    <p className="font-bold text-lg">{employee.bank_name || '---'}</p>
                                </div>
                                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                                    <p className="text-xs text-gray-500 mb-1">מספר סניף</p>
                                    <p className="font-bold text-lg">{employee.bank_branch || '---'}</p>
                                </div>
                                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                                    <p className="text-xs text-gray-500 mb-1">מספר חשבון</p>
                                    <p className="font-bold text-lg tracking-wider">{employee.bank_account || '---'}</p>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>

                    {/* Employment Tab */}
                    <TabsContent value="employment">
                        <Card className="p-6">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Building2 className="w-6 h-6 text-primary" />
                                נתוני העסקה
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-2">תפקיד נוכחי</p>
                                        <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                            <div className="bg-white p-2 rounded-lg shadow-sm">
                                                <Briefcase className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{employee.job_title}</p>
                                                <p className="text-xs text-gray-500">החל מ-{format(new Date(employee.hire_date), 'MM/yyyy')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-2">מנהל ישיר</p>
                                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <Avatar className="w-10 h-10">
                                                <AvatarFallback>MG</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold text-gray-900">ישראל ישראלי (דוגמה)</p>
                                                <p className="text-xs text-gray-500">מנהל מחלקת פיתוח</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <p className="text-xs text-gray-500 mb-1">תאריך תחילת עבודה</p>
                                            <p className="font-bold">{format(new Date(employee.hire_date), 'dd/MM/yyyy')}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <p className="text-xs text-gray-500 mb-1">סוג העסקה</p>
                                            <p className="font-bold">{employee.employment_type === 'full_time' ? 'משרה מלאה' : 'אחר'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>

                    {/* Documents Tab */}
                    <TabsContent value="documents">
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <FileText className="w-6 h-6 text-primary" />
                                    תיק מסמכים
                                </h3>
                                <Button>
                                    <Upload className="w-4 h-4 ml-2" />
                                    העלאת מסמך
                                </Button>
                            </div>

                            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <h4 className="text-lg font-medium text-gray-900">אין מסמכים עדיין</h4>
                                <p className="text-gray-500 text-sm mt-1">העלה חוזי עבודה, טפסים ואישורים לתיק העובד</p>
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Edit Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="עריכת פרטי עובד">
                <div className="max-h-[80vh] overflow-y-auto px-1">
                    <EmployeeForm
                        initialData={employee}
                        onSuccess={() => {
                            setIsEditModalOpen(false)
                            fetchEmployee()
                        }}
                        onCancel={() => setIsEditModalOpen(false)}
                    />
                </div>
            </Modal>
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { format, formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import {
    User, Mail, Phone, MapPin, Briefcase, Hash, CreditCard,
    Edit, Trash2, ArrowRight, Shield, Activity, FileText, Upload
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { toast } from 'react-hot-toast'
import { Modal } from '@/components/ui/modal'
import { EmployeeForm } from '@/components/core/EmployeeForm'
import { EmployeeProfileLayout } from '@/components/core/employee-file/EmployeeProfileLayout'
import { HistoryTable } from '@/components/core/employee-file/HistoryTable'
import { JobDetailsTab } from '@/components/core/employee-file/tabs/JobDetailsTab'
import { PersonalDetailsTab } from '@/components/core/employee-file/tabs/PersonalDetailsTab'

export default function EmployeeProfilePage() {
    const params = useParams()
    const router = useRouter()
    const { currentOrg } = useOrganization()
    const [employee, setEmployee] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('overview')

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

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                )
            case 'personal':
                return (
                    <PersonalDetailsTab
                        employee={employee}
                        onSuccess={fetchEmployee}
                        onOverviewClick={() => setActiveTab('overview')}
                    />
                )
            case 'employment':
                return (
                    <JobDetailsTab
                        employee={employee}
                        onSuccess={fetchEmployee}
                        onOverviewClick={() => setActiveTab('overview')}
                    />
                )
            case 'documents':
                return (
                    <Card className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                )
            case 'history':
                return (
                    <Card className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Activity className="w-6 h-6 text-primary" />
                            תיק שינויים מלא
                        </h3>
                        <HistoryTable
                            employeeId={employee.id}
                            columns={[
                                { key: 'first_name', label: 'שם פרטי' },
                                { key: 'last_name', label: 'שם משפחה' },
                                { key: 'job_title', label: 'תפקיד' },
                                { key: 'change_reason', label: 'סיבת שינוי' },
                            ]}
                        />
                    </Card>
                )
            default:
                return null
        }
    }

    return (
        <div className="min-h-screen bg-gray-50/50" dir="rtl">
            {/* Dense Header Strip (Hilan Style) */}
            <div className="bg-gradient-to-r from-slate-100 to-slate-200 border-b border-gray-300 sticky top-0 z-20 shadow-sm h-12 flex items-center px-4">
                <div className="w-full px-6 flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm">
                        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-600 hover:text-gray-900 h-8 px-2">
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border shadow-sm">
                            <span className="text-gray-500 text-xs">מס' עובד:</span>
                            <span className="font-mono font-bold text-blue-700">{employee.employee_number || '---'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800 text-base">{employee.first_name} {employee.last_name}</span>
                        </div>
                        <div className="h-4 w-px bg-gray-300 mx-2"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500">תפקיד:</span>
                            <span className="font-medium text-gray-700">{employee.job_title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500">מחלקה:</span>
                            <span className="font-medium text-gray-700">{employee.department || '---'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500">סטטוס:</span>
                            <span className="font-medium text-green-600">פעיל (רגיל)</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:bg-blue-50" onClick={() => setIsEditModalOpen(true)}>
                            <Edit className="w-3 h-3 ml-1" />
                            עריכה
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content with Side Nav */}
            <div className="w-full px-6 py-8">
                <EmployeeProfileLayout activeTab={activeTab} onTabChange={setActiveTab}>
                    {renderTabContent()}
                </EmployeeProfileLayout>
            </div>
        </div>
    )
}

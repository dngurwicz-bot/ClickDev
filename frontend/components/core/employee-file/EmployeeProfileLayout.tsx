'use client'

import { ReactNode } from 'react'
import { User, FileText, Briefcase, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useSidebarActions } from '@/lib/contexts/SidebarContext'
import { useEffect } from 'react'

interface EmployeeProfileLayoutProps {
    children: ReactNode
    activeTab: string
    onTabChange: (tab: string) => void
}

const SUB_NAV_ITEMS: Record<string, { id: string; label: string }[]> = {
    job: [
        { id: 'job-info', label: 'פרטי עיסוק' },
        { id: 'org-structure', label: 'מבנה ארגוני' },
        { id: 'seniority', label: 'ותק וניסיון' },
    ],
}

export function EmployeeProfileLayout({ children, activeTab, onTabChange }: EmployeeProfileLayoutProps) {
    const { setCustomItems } = useSidebarActions()

    useEffect(() => {
        const overviewItem = {
            id: 'overview-nav',
            label: 'תקציר',
            onClick: () => onTabChange('overview')
        }

        if (activeTab === 'hr' || activeTab === 'documents' || activeTab === 'overview') {
            // For other simple tabs that don't have their own internal layout/sidebar
            setCustomItems([overviewItem])
        }
        // Tabs 'personal', 'job' and 'salary' use HilanModuleLayout which will overwrite this.
        // We will pass the overview handler to them.

        return () => setCustomItems([])
    }, [activeTab, setCustomItems, onTabChange])

    return (
        <div className="flex flex-col h-full w-full" dir="rtl">
            <div className="w-full bg-white border-b mb-6 sticky top-0 z-10">
                <div className="w-full px-6 py-2">
                    <Tabs dir="rtl" value={activeTab} onValueChange={onTabChange} className="w-full">
                        <TabsList className="w-full justify-start h-12 bg-transparent p-0 gap-2 overflow-x-auto">
                            <TabsTrigger
                                value="personal"
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-10 px-6 rounded-md border border-transparent data-[state=active]:shadow-none hover:bg-slate-100"
                            >
                                <User className="w-4 h-4 ml-2" />
                                פרטים אישיים
                            </TabsTrigger>

                            <TabsTrigger
                                value="job"
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-10 px-6 rounded-md border border-transparent data-[state=active]:shadow-none hover:bg-slate-100"
                            >
                                <Briefcase className="w-4 h-4 ml-2" />
                                פרטי העסקה
                            </TabsTrigger>

                            <TabsTrigger
                                value="hr"
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-10 px-6 rounded-md border border-transparent data-[state=active]:shadow-none hover:bg-slate-100"
                            >
                                <User className="w-4 h-4 ml-2" />
                                משאבי אנוש
                            </TabsTrigger>

                            <TabsTrigger
                                value="documents"
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-10 px-6 rounded-md border border-transparent data-[state=active]:shadow-none hover:bg-slate-100"
                            >
                                <FileText className="w-4 h-4 ml-2" />
                                מסמכים
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            <div className="w-full px-6 pb-8 flex-1">
                {children}
            </div>
        </div>
    )
}

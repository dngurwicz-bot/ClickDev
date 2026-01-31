'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    FileSpreadsheet,
    FileText,
    Printer,
    Plus,
    RotateCcw,
    Search,
    Filter,
    Table as TableIcon,
    Settings2,
    Download,
    Upload
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function EmployeeToolbar() {
    return (
        <div className="flex items-center justify-between p-3 border-b bg-white shadow-sm font-sans" dir="rtl">
            <div className="flex items-center gap-2">
                {/* File Actions - Grouped and Styled */}
                <div className="flex items-center gap-1.5 px-3 border-l border-gray-100">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-success hover:bg-success/10 rounded-xl transition-all" title="ייצוא לאקסל">
                        <FileSpreadsheet className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-danger hover:bg-danger/10 rounded-xl transition-all" title="ייצוא ל-PDF">
                        <FileText className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-secondary hover:bg-gray-100 rounded-xl transition-all" title="הדפסה">
                        <Printer className="h-5 w-5" />
                    </Button>
                </div>

                {/* System Actions */}
                <div className="flex items-center gap-1.5 px-3 border-l border-gray-100">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10 rounded-xl transition-all" title="פתיחת עובד חדש">
                        <Plus className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-text-muted hover:bg-gray-100 rounded-xl transition-all" title="רענן נתונים">
                        <RotateCcw className="h-5 w-5" />
                    </Button>
                </div>

                {/* Settings Actions */}
                <div className="flex items-center gap-1.5 px-3">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-info hover:bg-info/10 rounded-xl transition-all" title="הגדרות טבלה">
                        <TableIcon className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-text-muted hover:bg-gray-100 rounded-xl transition-all" title="הגדרות מתקדמות">
                        <Settings2 className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-4">
                <div className="relative group">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="חיפוש עובד (שם, ת.ז...)"
                        className="h-10 w-80 pr-10 text-sm bg-gray-50 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl transition-all"
                    />
                </div>
                <Button variant="outline" size="sm" className="h-10 gap-2 border-gray-200 text-secondary font-bold px-4 rounded-xl hover:bg-gray-50">
                    <Filter className="h-4 w-4" />
                    <span>סינון</span>
                </Button>
            </div>
        </div>
    )
}

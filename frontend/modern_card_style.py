import os

file_path = r"c:\ClickDev\ClickDev\frontend\components\employees\EmployeeDetails.tsx"

# We will Construct the NEW JSX and replace the old return block.
# The logic part stays the same.

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Imports if needed
# We need Badge, Avatar, Separator... let's check if they are imported.
# We will just ADD them to the imports at top if missing.

imports_to_add = """
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs' // If using shadcn tabs
"""

# Simple insert after imports
if "import { Badge }" not in content:
    content = content.replace("import { cn } from '@/lib/utils'", "import { cn } from '@/lib/utils'\n" + imports_to_add)

# 2. Replace the Main Render (Return)
# We find where `return (` starts for the component.
# It is around line 542 in previous version.
# `    return (`
# We need to find the matching closing of root div `</div> )`.

# Let's find `return (` inside `EmployeeDetails`.
# SEARCH: `    return (`
# But there is a `if (!employee && !isNew)` return block before it.
# We want the MAIN return.

# The main return starts after `if (!employee && !isNew) { ... }`
# Marker could be `    return (` followed by `<div className="flex flex-col h-full`.

# Strategy: Find `return (`.
# Check if next line contains `flex flex-col h-full`.

lines = content.splitlines()
main_return_start = -1

for i, line in enumerate(lines):
    if "return (" in line:
        # Check next few lines
        if i+1 < len(lines) and ("flex flex-col" in lines[i+1] or "dir=\"rtl\"" in lines[i+1] or "bg-[#f0f2f5]" in lines[i+1]):
            main_return_start = i
            break

if main_return_start != -1:
    # Now valid logic to replace.
    # The new JSX structure:
    new_jsx = """    return (
        <div className="flex flex-col h-full bg-slate-50 font-sans text-right" dir="rtl">
            {/* MODERN HEADER CARD */}
            <div className="bg-white px-8 py-6 border-b border-gray-200 shadow-sm flex items-start justify-between">
                <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">
                            {formData.firstName?.[0]}{formData.lastName?.[0]}
                        </AvatarFallback>
                    </Avatar>
                    
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                {formData.firstName} {formData.lastName}
                            </h1>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
                                פעיל
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-gray-500 mt-2 text-sm font-medium">
                            <div className="flex items-center gap-1">
                                <Briefcase className="w-4 h-4" />
                                <span>{employee?.position || 'מפתח פול סטאק'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{employee?.address || 'תל אביב-יפו'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Building2 className="w-4 h-4" />
                                <span>{employee?.department || 'פיתוח'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button 
                         variant="outline" 
                         className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 hidden md:flex"
                         onClick={() => onEdit?.()}
                    >
                        <Printer className="w-4 h-4 ml-2" />
                        הדפס כרטיס
                    </Button>
                    <Button 
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:shadow-lg"
                        onClick={handleSave}
                    >
                        <CheckCircle2 className="w-4 h-4 ml-2" />
                        שמור שינויים
                    </Button>
                </div>
            </div>

            {/* MAIN CONTENT - TABS & CARDS */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                
                {/* NAVIGATION TABS */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 w-fit shadow-sm mx-auto md:mx-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id)
                                if (tab.id === 'general') setActiveTable('001')
                                if (tab.id === 'salary') setActiveTable('101') // Keeping mapping logic
                            }}
                            className={cn(
                                "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 gap-2",
                                activeTab === tab.id
                                    ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                            )}
                        >
                            {tab.id === 'general' && <User className="w-4 h-4" />}
                            {tab.id === 'employment' && <Briefcase className="w-4 h-4" />}
                            {tab.id === 'salary' && <MapPin className="w-4 h-4" />} {/* Mapped to Address */}
                            {tab.id === 'hr' && <ShieldCheck className="w-4 h-4" />}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* CONTENT AREA */}
                <div className="max-w-5xl animate-in fade-in slide-in-from-bottom-3 duration-500">
                    
                    {/* CONDITIONAL CONTENT BASED ON TABS */}
                    
                    {(activeTab === 'general' && activeTable === '001') && (
                        <div className="grid grid-cols-12 gap-8">
                            {/* LEFT COLUMN (Details) */}
                            <div className="col-span-12 md:col-span-8 space-y-6">
                                
                                {/* CARD: BASIC INFO */}
                                <Card className="p-6 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">פרטים אישיים</h3>
                                    </div>

                                    {(isEditing || isNew) && (
                                        <div className="mb-6">
                                             <ActionCodeSelector />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">שם פרטי</Label>
                                            <input 
                                                value={formData.firstName}
                                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-gray-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">שם משפחה</Label>
                                            <input 
                                                value={formData.lastName}
                                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-gray-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">מספר עובד</Label>
                                            <input 
                                                value={formData.employeeId}
                                                onChange={(e) => handleInputChange('employeeId', e.target.value)}
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-gray-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">תעודת זהות</Label>
                                            <input 
                                                value={formData.idNumber}
                                                onChange={(e) => handleInputChange('idNumber', e.target.value)}
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-gray-900"
                                            />
                                        </div>
                                    </div>
                                </Card>

                                {/* CARD: ADDITIONAL INFO */}
                                <Card className="p-6 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">תאריכים וסטטוס</h3>
                                    </div>
                                    
                                     <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">תאריך לידה</Label>
                                            <input 
                                                value={formData.birthDate}
                                                onChange={(e) => handleInputChange('birthDate', formatDate(e.target.value))}
                                                placeholder="DD/MM/YYYY"
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-gray-900"
                                            />
                                        </div>
                                     </div>
                                </Card>
                            </div>

                            {/* RIGHT COLUMN (Stats / Quick Actions) */}
                            <div className="col-span-12 md:col-span-4 space-y-6">
                                <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-lg p-6">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <p className="text-blue-100 font-medium mb-1">יתרת חופשה</p>
                                            <h2 className="text-3xl font-black">12.5 <span className="text-sm font-normal opacity-80">ימים</span></h2>
                                        </div>
                                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                            <Star className="w-6 h-6 text-yellow-300" />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-white/20">
                                        <p className="text-blue-100 font-medium">ימי מחלה</p>
                                        <p className="text-xl font-bold">5.0</p>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* HISTORY TABLE & ADDRESS LOGIC */}
                    {(activeTab === 'general' && activeTable === '100') && (
                        <Card className="border-gray-200 shadow-sm overflow-hidden">
                             <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                 <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                     <FileText className="w-4 h-4 text-gray-500" />
                                     היסטוריית שינוי שם
                                 </h3>
                                 <div className="flex gap-2">
                                    <Button size="sm" variant={table100Mode === 'table' ? 'secondary' : 'ghost'} onClick={() => { setTable100Mode('table'); setSelectedHistoryRecord(null); }}>
                                        טבלה
                                    </Button>
                                    <Button size="sm" variant={table100Mode === 'form' ? 'secondary' : 'ghost'} onClick={() => { setTable100Mode('form'); setSelectedHistoryRecord(null); }}>
                                        טופס
                                    </Button>
                                 </div>
                             </div>
                             <div className="p-6">
                                 {/* Reuse existing Table 100 Logic but stripped of 'Priority' styling */}
                                 {table100Mode === 'form' ? (
                                     <div className="space-y-4 max-w-lg">
                                        <ActionCodeSelector />
                                        <div className="space-y-2">
                                            <Label>שם משפחה</Label>
                                            <input value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} className="w-full p-2 border rounded" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>שם פרטי</Label>
                                            <input value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} className="w-full p-2 border rounded" />
                                        </div>
                                     </div>
                                 ) : (
                                     <div className="overflow-x-auto">
                                         <table className="w-full text-sm text-right">
                                             <thead className="bg-gray-100 text-gray-600 font-semibold uppercase text-xs">
                                                 <tr>
                                                     <th className="p-3">שם משפחה</th>
                                                     <th className="p-3">שם פרטי</th>
                                                     <th className="p-3">תאריך שינוי</th>
                                                 </tr>
                                             </thead>
                                             <tbody className="divide-y divide-gray-100">
                                                 {filteredNameHistory.map((rec) => (
                                                     <tr key={rec.id} className="hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => { setSelectedHistoryRecord(rec); setFormData(prev => ({...prev, firstName: rec.first_name_he, lastName: rec.last_name_he})); setTable100Mode('form'); }}>
                                                         <td className="p-3 font-medium text-gray-900">{rec.last_name_he}</td>
                                                         <td className="p-3 text-gray-600">{rec.first_name_he}</td>
                                                         <td className="p-3 text-gray-500">
                                                             {rec.effective_from ? new Date(rec.effective_from).toLocaleDateString('he-IL') : '-'}
                                                         </td>
                                                     </tr>
                                                 ))}
                                             </tbody>
                                         </table>
                                     </div>
                                 )}
                             </div>
                        </Card>
                    )}

                    {(activeTab === 'salary' && activeTable === '101') && ( // Address
                         <Card className="border-gray-200 shadow-sm overflow-hidden">
                             <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                 <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                     <MapPin className="w-4 h-4 text-gray-500" />
                                     כתובות ופרטי קשר
                                 </h3>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant={table101Mode === 'table' ? 'secondary' : 'ghost'} onClick={() => { setTable101Mode('table'); setSelectedAddressRecord(null); }}>
                                        טבלה
                                    </Button>
                                    <Button size="sm" variant={table101Mode === 'form' ? 'secondary' : 'ghost'} onClick={() => { setTable101Mode('form'); setSelectedAddressRecord(null); }}>
                                        טופס
                                    </Button>
                                 </div>
                             </div>
                             <div className="p-6">
                                 {table101Mode === 'form' ? (
                                     <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2"><ActionCodeSelector /></div>
                                        <div className="space-y-2">
                                            <Label>עיר</Label>
                                            <input value={addressFormData.city_name} onChange={(e) => handleAddressInputChange('city_name', e.target.value)} className="w-full p-2 border rounded" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>רחוב</Label>
                                            <input value={addressFormData.street} onChange={(e) => handleAddressInputChange('street', e.target.value)} className="w-full p-2 border rounded" />
                                        </div>
                                         <div className="space-y-2">
                                            <Label>מספר בית</Label>
                                            <input value={addressFormData.house_number} onChange={(e) => handleAddressInputChange('house_number', e.target.value)} className="w-full p-2 border rounded" />
                                        </div>
                                         <div className="space-y-2">
                                            <Label>מיקוד</Label>
                                            <input value={addressFormData.postal_code} onChange={(e) => handleAddressInputChange('postal_code', e.target.value)} className="w-full p-2 border rounded" />
                                        </div>
                                     </div>
                                 ) : (
                                      <div className="overflow-x-auto">
                                         <table className="w-full text-sm text-right">
                                             <thead className="bg-gray-100 text-gray-600 font-semibold uppercase text-xs">
                                                 <tr>
                                                     <th className="p-3">עיר</th>
                                                     <th className="p-3">רחוב</th>
                                                     <th className="p-3">מספר</th>
                                                     <th className="p-3">תאריך</th>
                                                 </tr>
                                             </thead>
                                             <tbody className="divide-y divide-gray-100">
                                                 {addressHistory.map((rec, idx) => (
                                                     <tr key={rec.id || idx} className="hover:bg-blue-50 transition-colors">
                                                         <td className="p-3 font-medium text-gray-900">{rec.city_name}</td>
                                                         <td className="p-3 text-gray-600">{rec.street}</td>
                                                         <td className="p-3 text-gray-500">{rec.house_number}</td>
                                                          <td className="p-3 text-gray-500">
                                                             {rec.effective_from ? new Date(rec.effective_from).toLocaleDateString('he-IL') : '-'}
                                                         </td>
                                                     </tr>
                                                 ))}
                                             </tbody>
                                         </table>
                                     </div>
                                 )}
                             </div>
                         </Card>
                    )}

                </div>
            </div>
        </div>
    )
"""
    # Replace content from main_return_start to the end of the return block.
    # The return block ends with the last closing brace logic.
    # Since we are essentially replacing the ENTIRE view logic, we effectively keep everything UP TO `main_return_start` and replace the rest (except the final closing brace of the function).
    
    # Wait, the function ends with:
    # `}` (closing function)
    # The return block ends with `)`
    
    # We can reconstruct the file:
    # 0 to main_return_start
    # new_jsx
    # closing brace `}`
    
    new_content = "\n".join(lines[:main_return_start]) + "\n" + new_jsx + "\n}"
    
    with open(file_path, 'w', encoding='utf-8') as f_write:
        f_write.write(new_content)
        
    print("Modern Card Style applied successfully.")
else:
    print("Could not find Main Return block.")

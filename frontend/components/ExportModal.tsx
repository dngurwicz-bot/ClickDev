'use client'

import { X, Download, FileSpreadsheet } from 'lucide-react'
import { useState } from 'react'

interface ExportModalProps {
    onClose: () => void
    onExport: (type: 'all' | 'filtered' | 'custom', customCount?: number) => void
    totalCount: number
    filteredCount: number
    hasFilters: boolean
}

export default function ExportModal({
    onClose,
    onExport,
    totalCount,
    filteredCount,
    hasFilters
}: ExportModalProps) {
    const [exportType, setExportType] = useState<'all' | 'filtered' | 'custom'>(
        hasFilters ? 'filtered' : 'all'
    )
    const [customCount, setCustomCount] = useState(filteredCount)

    const handleExport = () => {
        onExport(exportType, exportType === 'custom' ? customCount : undefined)
        onClose()
    }

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-full">
                                <FileSpreadsheet className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">יצוא לאקסל</h2>
                                <p className="text-sm text-gray-500">בחר את סוג הייצוא</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Options */}
                <div className="p-6 space-y-3">
                    {/* All Records */}
                    <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${exportType === 'all'
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                        <input
                            type="radio"
                            name="exportType"
                            value="all"
                            checked={exportType === 'all'}
                            onChange={() => setExportType('all')}
                            className="mt-1"
                        />
                        <div className="flex-1">
                            <div className="font-semibold text-gray-900">כל הרשומות</div>
                            <div className="text-sm text-gray-500">ייצוא של {totalCount} הודעות</div>
                        </div>
                    </label>

                    {/* Filtered Records */}
                    {hasFilters && (
                        <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${exportType === 'filtered'
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}>
                            <input
                                type="radio"
                                name="exportType"
                                value="filtered"
                                checked={exportType === 'filtered'}
                                onChange={() => setExportType('filtered')}
                                className="mt-1"
                            />
                            <div className="flex-1">
                                <div className="font-semibold text-gray-900">לפי סינון נוכחי</div>
                                <div className="text-sm text-gray-500">ייצוא של {filteredCount} הודעות מסוננות</div>
                            </div>
                        </label>
                    )}

                    {/* Custom Count */}
                    <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${exportType === 'custom'
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                        <input
                            type="radio"
                            name="exportType"
                            value="custom"
                            checked={exportType === 'custom'}
                            onChange={() => setExportType('custom')}
                            className="mt-1"
                        />
                        <div className="flex-1">
                            <div className="font-semibold text-gray-900">מספר מותאם אישית</div>
                            <div className="text-sm text-gray-500 mb-2">בחר כמה רשומות לייצא</div>
                            {exportType === 'custom' && (
                                <input
                                    type="number"
                                    min="1"
                                    max={filteredCount}
                                    value={customCount}
                                    onChange={(e) => setCustomCount(parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            )}
                        </div>
                    </label>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                    >
                        ביטול
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                        <Download className="w-5 h-5" />
                        ייצוא
                    </button>
                </div>
            </div>
        </div>
    )
}

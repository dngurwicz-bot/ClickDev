"use client"

import { useState } from 'react'
import { Calendar, Filter, Download, RefreshCw, X } from 'lucide-react'
import { format, subDays, subMonths, subYears, startOfDay, endOfDay } from 'date-fns'
import { he } from 'date-fns/locale'

export type DateRange = {
  start: Date
  end: Date
}

export type PresetPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom'

interface AnalyticsFiltersProps {
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
  selectedOrganizations: string[]
  availableOrganizations: Array<{ id: string; name: string }>
  onOrganizationsChange: (orgs: string[]) => void
  onExport: () => void
  onRefresh: () => void
  loading?: boolean
}

export function AnalyticsFilters({
  dateRange,
  onDateRangeChange,
  selectedOrganizations,
  availableOrganizations,
  onOrganizationsChange,
  onExport,
  onRefresh,
  loading = false
}: AnalyticsFiltersProps) {
  const [preset, setPreset] = useState<PresetPeriod>('month')
  const [showOrgFilter, setShowOrgFilter] = useState(false)

  const applyPreset = (presetValue: PresetPeriod) => {
    setPreset(presetValue)
    const now = new Date()
    let start: Date
    let end: Date = endOfDay(now)

    switch (presetValue) {
      case 'today':
        start = startOfDay(now)
        break
      case 'week':
        start = startOfDay(subDays(now, 7))
        break
      case 'month':
        start = startOfDay(subMonths(now, 1))
        break
      case 'quarter':
        start = startOfDay(subMonths(now, 3))
        break
      case 'year':
        start = startOfDay(subYears(now, 1))
        break
      case 'all':
        start = startOfDay(subYears(now, 5))
        break
      default:
        return
    }

    onDateRangeChange({ start, end })
  }

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? startOfDay(new Date(e.target.value)) : dateRange.start
    onDateRangeChange({ ...dateRange, start: date })
    setPreset('custom')
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? endOfDay(new Date(e.target.value)) : dateRange.end
    onDateRangeChange({ ...dateRange, end: date })
    setPreset('custom')
  }

  const toggleOrganization = (orgId: string) => {
    if (selectedOrganizations.includes(orgId)) {
      onOrganizationsChange(selectedOrganizations.filter(id => id !== orgId))
    } else {
      onOrganizationsChange([...selectedOrganizations, orgId])
    }
  }

  const selectAllOrgs = () => {
    if (selectedOrganizations.length === availableOrganizations.length) {
      onOrganizationsChange([])
    } else {
      onOrganizationsChange(availableOrganizations.map(org => org.id))
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Date Presets */}
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(['today', 'week', 'month', 'quarter', 'year', 'all'] as PresetPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => applyPreset(p)}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                  ${preset === p
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {p === 'today' ? 'היום' :
                 p === 'week' ? 'שבוע' :
                 p === 'month' ? 'חודש' :
                 p === 'quarter' ? 'רבעון' :
                 p === 'year' ? 'שנה' : 'הכל'}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={format(dateRange.start, 'yyyy-MM-dd')}
            onChange={handleStartDateChange}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <span className="text-gray-400">עד</span>
          <input
            type="date"
            value={format(dateRange.end, 'yyyy-MM-dd')}
            onChange={handleEndDateChange}
            max={format(new Date(), 'yyyy-MM-dd')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Organization Filter */}
        <div className="relative">
          <button
            onClick={() => setShowOrgFilter(!showOrgFilter)}
            className={`
              flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors
              ${selectedOrganizations.length > 0
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            <Filter className="h-4 w-4" />
            ארגונים
            {selectedOrganizations.length > 0 && (
              <span className="bg-primary text-white rounded-full px-2 py-0.5 text-xs">
                {selectedOrganizations.length}
              </span>
            )}
          </button>

          {showOrgFilter && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-3 border-b border-gray-200">
                <button
                  onClick={selectAllOrgs}
                  className="text-sm text-primary hover:text-primary-dark font-medium"
                >
                  {selectedOrganizations.length === availableOrganizations.length ? 'בטל הכל' : 'בחר הכל'}
                </button>
              </div>
              <div className="p-2">
                {availableOrganizations.map((org) => (
                  <label
                    key={org.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedOrganizations.includes(org.id)}
                      onChange={() => toggleOrganization(org.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">{org.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            רענן
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            <Download className="h-4 w-4" />
            ייצא לאקסל
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(preset === 'custom' || selectedOrganizations.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-800">פילטרים פעילים:</span>
          {preset === 'custom' && (
            <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
              {format(dateRange.start, 'dd/MM/yyyy', { locale: he })} - {format(dateRange.end, 'dd/MM/yyyy', { locale: he })}
            </span>
          )}
          {selectedOrganizations.length > 0 && (
            <>
              {selectedOrganizations.slice(0, 3).map((orgId) => {
                const org = availableOrganizations.find(o => o.id === orgId)
                return org ? (
                  <span
                    key={orgId}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                  >
                    {org.name}
                    <button
                      onClick={() => toggleOrganization(orgId)}
                      className="hover:text-blue-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ) : null
              })}
              {selectedOrganizations.length > 3 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  +{selectedOrganizations.length - 3} נוספים
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

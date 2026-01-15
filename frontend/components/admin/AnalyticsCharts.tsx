"use client"

import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'

const COLORS = ['#00A896', '#00B09B', '#00C8A8', '#00E0B5', '#00F8C2', '#10FFCF', '#20FFD6', '#30FFDD', '#40FFE4', '#50FFEB']

interface AnalyticsChartsProps {
  orgsGrowth: Array<{ month: string; ארגונים: number }>
  employeesGrowth: Array<{ month: string; עובדים: number }>
  topOrgsChart: Array<{ name: string; עובדים: number }>
  activeVsInactive: Array<{ name: string; value: number; color: string }>
  roleChartData: Array<{ name: string; value: number }>
  tierChartData: Array<{ name: string; value: number }>
}

export function AnalyticsCharts({
  orgsGrowth,
  employeesGrowth,
  topOrgsChart,
  activeVsInactive,
  roleChartData,
  tierChartData
}: AnalyticsChartsProps) {
  return (
    <>
      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Organizations Growth */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">גידול ארגונים</h3>
              <p className="text-sm text-text-secondary">6 חודשים אחרונים</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={orgsGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                stroke="#94A3B8"
                fontSize={12}
              />
              <YAxis 
                stroke="#94A3B8"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="ארגונים" 
                stroke="#00A896" 
                strokeWidth={3}
                dot={{ fill: '#00A896', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Employees Growth */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">גידול עובדים</h3>
              <p className="text-sm text-text-secondary">6 חודשים אחרונים</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={employeesGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                stroke="#94A3B8"
                fontSize={12}
              />
              <YAxis 
                stroke="#94A3B8"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="עובדים" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Organizations by Employees */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">ארגונים מובילים</h3>
              <p className="text-sm text-text-secondary">לפי מספר עובדים</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topOrgsChart} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#94A3B8" fontSize={12} />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="#94A3B8"
                fontSize={12}
                width={100}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="עובדים" 
                fill="#00A896" 
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Active vs Inactive Organizations */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">סטטוס ארגונים</h3>
              <p className="text-sm text-text-secondary">פעילים vs לא פעילים</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={activeVsInactive}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {activeVsInactive.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row - Distribution Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Users by Role */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">התפלגות משתמשים</h3>
              <p className="text-sm text-text-secondary">לפי תפקיד</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={roleChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {roleChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Organizations by Subscription Tier */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">התפלגות מנויים</h3>
              <p className="text-sm text-text-secondary">לפי רמת מנוי</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tierChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                stroke="#94A3B8"
                fontSize={12}
              />
              <YAxis 
                stroke="#94A3B8"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="value" 
                fill="#00A896" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}

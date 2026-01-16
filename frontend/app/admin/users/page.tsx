'use client'

import { useState, useEffect } from 'react'
import { Users, Search } from 'lucide-react'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch users from API
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">משתמשים</h1>
      
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-text-secondary">דף ניהול משתמשים - בפיתוח</p>
      </div>
    </div>
  )
}

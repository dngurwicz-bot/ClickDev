"use client"

import { useState, useEffect, useCallback } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface SearchInputProps {
  placeholder?: string
  className?: string
  debounceMs?: number
}

export function SearchInput({ 
  placeholder = "חיפוש...", 
  className = "",
  debounceMs = 300
}: SearchInputProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [value, setValue] = useState(searchParams.get('q') || '')
  const [isSearching, setIsSearching] = useState(false)

  // Update URL with search query
  const updateSearch = useCallback((searchValue: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (searchValue) {
      params.set('q', searchValue)
    } else {
      params.delete('q')
    }
    
    router.push(`${pathname}?${params.toString()}`)
    setIsSearching(false)
  }, [pathname, router, searchParams])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value !== (searchParams.get('q') || '')) {
        updateSearch(value)
      } else {
        setIsSearching(false)
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [value, debounceMs, updateSearch, searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    setIsSearching(true)
  }

  const handleClear = () => {
    setValue('')
    updateSearch('')
  }

  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        {isSearching ? (
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        ) : (
          <Search className="h-5 w-5 text-gray-400" />
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pr-10 pl-10 text-sm text-text-primary placeholder-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}

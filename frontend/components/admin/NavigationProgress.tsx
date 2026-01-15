"use client"

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'

export function NavigationProgress() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const prevPathnameRef = useRef(pathname)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check if pathname changed
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname
      
      // Hide loader when navigation completes
      setIsVisible(false)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      setTimeout(() => {
        setIsLoading(false)
      }, 300)
    }
  }, [pathname])

  useEffect(() => {
    // Intercept link clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a[href]') as HTMLAnchorElement
      
      if (link && link.href) {
        try {
          const url = new URL(link.href)
          const currentUrl = new URL(window.location.href)
          
          // Only show loader for internal navigation
          if (url.origin === currentUrl.origin && url.pathname !== currentUrl.pathname) {
            setIsLoading(true)
            
            // Clear any existing timeout
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
            }
            
            // Show loader after short delay to avoid flickering
            timeoutRef.current = setTimeout(() => {
              setIsVisible(true)
            }, 200)
          }
        } catch (err) {
          // Invalid URL, ignore
        }
      }
    }

    // Use capture phase to catch clicks early
    document.addEventListener('click', handleClick, true)

    return () => {
      document.removeEventListener('click', handleClick, true)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  if (!isLoading || !isVisible) return null

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex items-center justify-center bg-white/90 backdrop-blur-sm
        transition-opacity duration-300 ease-in-out
        ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Logo with pulse animation */}
        <div className="relative">
          <div className="animate-pulse">
            <Logo className="scale-125" />
          </div>
          {/* Spinning ring */}
          <div className="absolute inset-0 -m-6">
            <div 
              className="h-full w-full rounded-full border-4 border-primary/30 border-t-primary animate-spin"
              style={{ animationDuration: '1s' }}
            />
          </div>
        </div>
        
        {/* Loading dots */}
        <div className="flex items-center gap-2 text-sm text-text-secondary font-medium">
          <span>טוען</span>
          <div className="flex gap-1">
            <span 
              className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
            />
            <span 
              className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: '200ms', animationDuration: '1.4s' }}
            />
            <span 
              className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: '400ms', animationDuration: '1.4s' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

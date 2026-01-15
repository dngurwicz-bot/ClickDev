"use client"

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Logo } from './Logo'

export function PageLoader() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Reset loading state when pathname changes
    setLoading(false)
    setIsVisible(false)
  }, [pathname])

  useEffect(() => {
    // Show loader after a short delay to avoid flickering on fast transitions
    let timeoutId: NodeJS.Timeout
    let loadingTimeoutId: NodeJS.Timeout

    const handleStart = () => {
      loadingTimeoutId = setTimeout(() => {
        setLoading(true)
        // Small delay before showing to avoid flickering
        timeoutId = setTimeout(() => {
          setIsVisible(true)
        }, 100)
      }, 150) // Only show if loading takes more than 150ms
    }

    const handleComplete = () => {
      clearTimeout(timeoutId)
      clearTimeout(loadingTimeoutId)
      setIsVisible(false)
      // Wait for fade out animation
      setTimeout(() => {
        setLoading(false)
      }, 300)
    }

    // Listen to navigation events
    const handleRouteChangeStart = () => handleStart()
    const handleRouteChangeComplete = () => handleComplete()

    // Use Next.js router events via window events
    window.addEventListener('beforeunload', handleStart)
    
    // For client-side navigation, we'll use a custom event
    // This will be triggered by our navigation wrapper
    window.addEventListener('routeChangeStart', handleRouteChangeStart)
    window.addEventListener('routeChangeComplete', handleRouteChangeComplete)

    return () => {
      clearTimeout(timeoutId)
      clearTimeout(loadingTimeoutId)
      window.removeEventListener('beforeunload', handleStart)
      window.removeEventListener('routeChangeStart', handleRouteChangeStart)
      window.removeEventListener('routeChangeComplete', handleRouteChangeComplete)
    }
  }, [])

  if (!loading) return null

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm
        transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
      style={{ 
        transition: 'opacity 0.3s ease-in-out',
      }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Logo with animation */}
        <div className="relative">
          <div className="animate-pulse">
            <Logo className="scale-110" />
          </div>
          {/* Spinning ring around logo */}
          <div className="absolute inset-0 -m-4">
            <div className="h-full w-full rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
        </div>
        
        {/* Loading text */}
        <div className="flex items-center gap-2 text-text-secondary">
          <div className="flex gap-1">
            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

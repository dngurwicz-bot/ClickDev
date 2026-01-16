import React from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showDngHub?: boolean
  className?: string
  variant?: 'default' | 'light' // light = white text for dark backgrounds
}

export default function Logo({ size = 'md', showDngHub = true, className = '', variant = 'default' }: LogoProps) {
  const sizeClasses = {
    sm: {
      main: 'text-xl',
      dot: 'text-xl',
      divider: 'h-4',
      dng: 'text-xs'
    },
    md: {
      main: 'text-2xl',
      dot: 'text-2xl',
      divider: 'h-5',
      dng: 'text-xs'
    },
    lg: {
      main: 'text-3xl',
      dot: 'text-3xl',
      divider: 'h-6',
      dng: 'text-sm'
    }
  }

  const classes = sizeClasses[size]
  
  const textColor = variant === 'light' ? 'text-white' : 'text-secondary'
  const dotColor = variant === 'light' ? 'text-primary' : 'text-primary' // Primary color works on both
  const dividerColor = variant === 'light' ? 'bg-gray-500' : 'bg-text-muted'
  const dngColor = variant === 'light' ? 'text-gray-300' : 'text-text-secondary'

  return (
    <div 
      className={`flex items-center justify-center gap-2.5 font-['Rubik'] cursor-pointer ${className}`}
      style={{ direction: 'ltr' }}
    >
      <div className={`${classes.main} font-black ${textColor}`} style={{ letterSpacing: '-1px' }}>
        CLICK<span className={dotColor}>.</span>
      </div>
      
      {showDngHub && (
        <>
          <div 
            className={`w-px ${classes.divider} ${dividerColor}`}
          />
          <div className={`${classes.dng} font-medium ${dngColor} leading-tight`}>
            DNG<br />HUB
          </div>
        </>
      )}
    </div>
  )
}

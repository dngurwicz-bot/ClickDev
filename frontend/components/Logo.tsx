import React from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showDngHub?: boolean
  className?: string
  variant?: 'default' | 'light' // light = white text for dark backgrounds
}


export default function Logo({ size = 'md', showDngHub = true, className = '', variant = 'default' }: LogoProps) {
  // Scaling factors for different sizes (preserving ratios)
  const scales = {
    sm: 0.7,
    md: 1,
    lg: 1.5
  }

  const scale = scales[size]

  return (
    <div
      className={`flex items-center justify-center font-['Rubik,sans-serif'] cursor-pointer ${className}`}
      style={{
        direction: 'ltr',
        gap: `${10 * scale}px`,
        fontFamily: "'Rubik', sans-serif"
      }}
    >
      <div style={{
        fontSize: `${28 * scale}px`,
        fontWeight: 900,
        color: variant === 'light' ? '#FFFFFF' : '#2C3E50',
        letterSpacing: '-1px'
      }}>
        CLICK<span style={{ color: variant === 'light' ? '#00A896' : '#00A896' }}>.</span>
      </div>

      {showDngHub && (
        <>
          <div style={{
            width: `${1 * Math.max(1, scale)}px`,
            height: `${20 * scale}px`,
            backgroundColor: variant === 'light' ? '#BDC3C7' : '#BDC3C7'
          }}></div>

          <div style={{
            fontSize: `${12 * scale}px`,
            fontWeight: 500,
            color: variant === 'light' ? '#BDC3C7' : '#7F8C8D',
            lineHeight: 1.2
          }}>
            DNG<br />HUB
          </div>
        </>
      )}
    </div>
  )
}


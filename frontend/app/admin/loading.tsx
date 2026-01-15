import { Logo } from '@/components/ui/Logo'

export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-bg-main">
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

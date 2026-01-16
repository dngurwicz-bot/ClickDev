'use client'
import { memo } from 'react'
import Logo from '@/components/Logo'

const GlobalLoader = () => {
    return (
        <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-6">
                <div className="relative flex items-center justify-center">
                    {/* Subtle breathing background */}
                    <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse blur-xl scale-150"></div>

                    <div className="relative z-10 p-6 bg-white rounded-2xl shadow-sm border border-gray-100/50 animate-in zoom-in-95 duration-500">
                        <Logo size="lg" showDngHub={true} />
                    </div>
                </div>

                {/* Professional loading indicator */}
                <div className="flex flex-col items-center gap-2">
                    <div className="flex space-x-1.5 direction-ltr">
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default memo(GlobalLoader)

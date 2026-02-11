'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    title?: string
    noPadding?: boolean
    size?: 'md' | 'lg' | 'xl' | 'full'
}

export function Modal({ isOpen, onClose, children, title, noPadding, size = 'md' }: ModalProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopImmediatePropagation()
                onClose()
            }
        }
        if (isOpen) window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [isOpen, onClose])

    if (!isOpen) return null

    const sizeClasses = {
        md: 'max-w-lg',
        lg: 'max-w-3xl',
        xl: 'max-w-6xl',
        full: 'max-w-[95vw] h-[90vh]'
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`relative w-full ${sizeClasses[size]} bg-white shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden border border-gray-400`} dir="rtl">
                {!noPadding && (
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <button
                            onClick={onClose}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}
                <div className={`flex-1 overflow-auto ${noPadding ? 'p-0' : 'p-6'}`}>
                    {children}
                </div>
            </div>
        </div>
    )
}

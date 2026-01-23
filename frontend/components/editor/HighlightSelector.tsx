'use client'

import { useState, useEffect, useRef } from 'react'
import { Highlighter, ChevronDown } from 'lucide-react'

interface HighlightSelectorProps {
    editor: any
}

const HIGHLIGHT_COLORS = [
    { label: 'ללא', value: '' },
    { label: 'צהוב', value: '#fef08a', color: '#fef08a' },
    { label: 'ירוק', value: '#bbf7d0', color: '#bbf7d0' },
    { label: 'כחול', value: '#bfdbfe', color: '#bfdbfe' },
    { label: 'ורוד', value: '#fbcfe8', color: '#fbcfe8' },
    { label: 'סגול', value: '#e9d5ff', color: '#e9d5ff' },
    { label: 'כתום', value: '#fed7aa', color: '#fed7aa' },
]

export const HighlightSelector = ({ editor }: HighlightSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const popoverRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleHighlight = (color: string) => {
        if (color === '') {
            editor.chain().focus().unsetHighlight().run()
        } else {
            editor.chain().focus().setHighlight({ color }).run()
        }
        setIsOpen(false)
    }

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded hover:bg-gray-100 flex items-center gap-1 ${editor.isActive('highlight') ? 'text-primary bg-primary/10' : 'text-gray-600'
                    }`}
                title="הדגשה"
                type="button"
            >
                <Highlighter className="w-4 h-4" />
                <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 p-3 bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-4 gap-2">
                        {HIGHLIGHT_COLORS.map((highlight) => (
                            <button
                                key={highlight.value}
                                onClick={() => handleHighlight(highlight.value)}
                                className="w-8 h-8 rounded border border-gray-200 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-primary/20 flex items-center justify-center"
                                style={{ backgroundColor: highlight.color || '#fff' }}
                                title={highlight.label}
                                type="button"
                            >
                                {highlight.value === '' && (
                                    <span className="text-xs text-gray-500">✕</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

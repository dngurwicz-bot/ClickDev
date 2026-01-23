'use client'

import { HexColorPicker } from 'react-colorful'
import { useState, useEffect, useRef } from 'react'
import { Palette, ChevronDown } from 'lucide-react'

interface ColorSelectorProps {
    editor: any
}

export const ColorSelector = ({ editor }: ColorSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [color, setColor] = useState('#000000')
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

    const handleColorChange = (newColor: string) => {
        setColor(newColor)
        editor.chain().focus().setColor(newColor).run()
    }

    const PRESET_COLORS = [
        '#000000', // Black
        '#EF4444', // Red 500
        '#F59E0B', // Amber 500
        '#10B981', // Emerald 500
        '#3B82F6', // Blue 500
        '#6366F1', // Indigo 500
        '#8B5CF6', // Violet 500
        '#EC4899', // Pink 500
        '#9CA3AF', // Gray 400
    ]

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded hover:bg-gray-100 flex items-center gap-1 ${editor.isActive('textStyle') ? 'text-primary bg-primary/10' : 'text-gray-600'
                    }`}
                title="צבע טקסט"
                type="button"
            >
                <Palette className="w-4 h-4" />
                <div
                    className="w-3 h-3 rounded-full border border-gray-200"
                    style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000000' }}
                />
                <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 p-3 bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-200 w-64">
                    <div className="mb-3">
                        <HexColorPicker color={color} onChange={handleColorChange} className="!w-full !h-32" />
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                        {PRESET_COLORS.map((presetColor) => (
                            <button
                                key={presetColor}
                                onClick={() => handleColorChange(presetColor)}
                                className="w-8 h-8 rounded-full border border-gray-200 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-primary/20"
                                style={{ backgroundColor: presetColor }}
                                title={presetColor}
                                type="button"
                            />
                        ))}
                        <button
                            onClick={() => {
                                editor.chain().focus().unsetColor().run()
                                setIsOpen(false)
                            }}
                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors text-xs"
                            title="בטל צבע"
                            type="button"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

function X(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    )
}

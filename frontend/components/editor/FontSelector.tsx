'use client'

import { useState, useEffect, useRef } from 'react'
import { Type, ChevronDown } from 'lucide-react'

interface FontSelectorProps {
    editor: any
}

const FONTS = [
    { label: 'ברירת מחדל', value: '' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Times New Roman', value: 'Times New Roman, serif' },
    { label: 'Courier New', value: 'Courier New, monospace' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Tahoma', value: 'Tahoma, sans-serif' },
    { label: 'Comic Sans MS', value: 'Comic Sans MS, cursive' },
    { label: 'Impact', value: 'Impact, fantasy' },
    { label: 'Rubik', value: 'Rubik, sans-serif' },
    { label: 'Heebo', value: 'Heebo, sans-serif' },
    { label: 'Assistant', value: 'Assistant, sans-serif' },
]

export const FontSelector = ({ editor }: FontSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [currentFont, setCurrentFont] = useState('')
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

    useEffect(() => {
        if (editor) {
            const fontFamily = editor.getAttributes('textStyle').fontFamily || ''
            setCurrentFont(fontFamily)
        }
    }, [editor])

    const handleFontChange = (fontValue: string) => {
        if (fontValue === '') {
            editor.chain().focus().unsetFontFamily().run()
        } else {
            editor.chain().focus().setFontFamily(fontValue).run()
        }
        setCurrentFont(fontValue)
        setIsOpen(false)
    }

    const getCurrentFontLabel = () => {
        const font = FONTS.find(f => f.value === currentFont)
        return font ? font.label : 'גופן'
    }

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 px-3 py-2 rounded hover:bg-gray-100 text-sm text-gray-700 min-w-[120px] justify-between"
                title="בחר גופן"
                type="button"
            >
                <div className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    <span>{getCurrentFontLabel()}</span>
                </div>
                <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-200 min-w-[200px] max-h-[300px] overflow-y-auto">
                    {FONTS.map((font) => (
                        <button
                            key={font.value}
                            onClick={() => handleFontChange(font.value)}
                            className={`w-full text-right px-4 py-2 hover:bg-gray-50 transition-colors ${currentFont === font.value ? 'bg-primary/10 text-primary' : 'text-gray-700'
                                }`}
                            style={{ fontFamily: font.value || 'inherit' }}
                            type="button"
                        >
                            {font.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

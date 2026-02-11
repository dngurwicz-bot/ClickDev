'use client'

import { useEffect } from 'react'

interface ConfirmDialogProps {
    isOpen: boolean
    onConfirm: () => void
    onDiscard: () => void
    onCancel: () => void
    title?: string
    message?: string
    confirmLabel?: string
    discardLabel?: string
    cancelLabel?: string
}

export function ConfirmDialog({
    isOpen,
    onConfirm,
    onDiscard,
    onCancel,
    title = 'שינויים שלא נשמרו',
    message = 'האם ברצונך לשמור את השינויים?',
    confirmLabel = 'שמור',
    discardLabel = 'אל תשמור',
    cancelLabel = 'ביטול',
}: ConfirmDialogProps) {
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopImmediatePropagation()
                e.preventDefault()
                onCancel()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onCancel])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
            <div className="relative w-full max-w-md bg-white shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-400">
                <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-sm text-gray-600">{message}</p>
                </div>
                <div className="flex items-center justify-end gap-2 px-6 pb-6">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onDiscard}
                        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
                    >
                        {discardLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#2980B9] hover:bg-[#2471A3] rounded transition-colors"
                        autoFocus
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}

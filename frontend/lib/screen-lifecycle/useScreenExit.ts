'use client'

import { useCallback, useEffect, useState } from 'react'
import { useNavigationStack } from '@/lib/screen-lifecycle/NavigationStackProvider'

interface UseScreenExitOptions {
    isDirty?: boolean
    save?: () => Promise<void> | void
    onDiscard?: () => void
    fallbackRoute: string
    enableEscape?: boolean
    onExit?: () => void
    exitAfterSave?: boolean
}

export function useScreenExit({
    isDirty = false,
    save,
    onDiscard,
    fallbackRoute,
    enableEscape = true,
    onExit,
    exitAfterSave = true,
}: UseScreenExitOptions) {
    const { goBackOrFallback } = useNavigationStack()
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const requestExit = useCallback(() => {
        if (isSaving) return

        if (!isDirty) {
            if (onExit) {
                onExit()
            } else {
                onDiscard?.()
                goBackOrFallback(fallbackRoute)
            }
            return
        }

        setIsConfirmOpen(true)
    }, [fallbackRoute, goBackOrFallback, isDirty, isSaving, onDiscard])

    const handleConfirmSave = useCallback(async () => {
        if (isSaving) return

        setIsConfirmOpen(false)
        setIsSaving(true)
        try {
            await save?.()
            if (exitAfterSave) {
                if (onExit) {
                    onExit()
                } else {
                    goBackOrFallback(fallbackRoute)
                }
            }
        } catch (error) {
            // Keep user on screen; caller handles error messaging.
            console.error('[useScreenExit] Save during exit failed:', error)
        } finally {
            setIsSaving(false)
        }
    }, [exitAfterSave, fallbackRoute, goBackOrFallback, isSaving, onExit, save])

    const handleConfirmDiscard = useCallback(() => {
        if (isSaving) return
        setIsConfirmOpen(false)
        if (onExit) {
            onDiscard?.()
            onExit()
        } else {
            onDiscard?.()
            goBackOrFallback(fallbackRoute)
        }
    }, [fallbackRoute, goBackOrFallback, isSaving, onDiscard, onExit])

    const handleConfirmCancel = useCallback(() => {
        if (isSaving) return
        setIsConfirmOpen(false)
    }, [isSaving])

    useEffect(() => {
        if (!enableEscape) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return

            // Let active modal/dialog consume ESC first.
            if (
                document.querySelector('.fixed.inset-0.z-50') ||
                document.querySelector('.fixed.inset-0.z-\\[60\\]') ||
                document.querySelector('[role="dialog"]')
            ) {
                return
            }

            e.preventDefault()
            requestExit()
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [enableEscape, requestExit])

    return {
        isConfirmOpen,
        isSaving,
        requestExit,
        handleConfirmSave,
        handleConfirmDiscard,
        handleConfirmCancel,
    }
}

'use client'

import { useState, useRef } from 'react'
import { Image as ImageIcon, Upload, Loader2, Link as LinkIcon, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface ImageUploaderProps {
    editor: any
}

export const ImageUploader = ({ editor }: ImageUploaderProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [imageUrl, setImageUrl] = useState('')
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const popoverRef = useRef<HTMLDivElement>(null)

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('נא להעלות קובץ תמונה בלבד')
            return
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            toast.error('התמונה גדולה מדי (מקסימום 5MB)')
            return
        }

        setUploading(true)
        try {
            const fileName = `${Date.now()}-${file.name}`
            const { data, error } = await supabase.storage
                .from('announcement-images')
                .upload(fileName, file)

            if (error) throw error

            const { data: { publicUrl } } = supabase.storage
                .from('announcement-images')
                .getPublicUrl(fileName)

            editor.chain().focus().setImage({ src: publicUrl }).run()
            setIsOpen(false)
            toast.success('תמונה הועלתה בהצלחה')
        } catch (error) {
            console.error('Error uploading image:', error)
            toast.error('שגיאה בהעלאת התמונה. ודא שיש באקט בשם "announcement-images"')
        } finally {
            setUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const addImageByUrl = () => {
        if (imageUrl) {
            editor.chain().focus().setImage({ src: imageUrl }).run()
            setIsOpen(false)
            setImageUrl('')
        }
    }

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded hover:bg-gray-100 flex items-center gap-1 ${editor.isActive('image') ? 'text-primary bg-primary/10' : 'text-gray-600'
                    }`}
                title="הוסף תמונה"
                type="button"
            >
                <ImageIcon className="w-4 h-4" />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 p-4 bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-200 w-80">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-900">הוספת תמונה</h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Upload Button */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            {uploading ? (
                                <div className="flex flex-col items-center text-primary">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                    <span className="text-sm">מעלה תמונה...</span>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-gray-400 mb-2 group-hover:text-primary transition-colors" />
                                    <span className="text-sm text-gray-600 font-medium">לחץ להעלאת תמונה</span>
                                    <span className="text-xs text-gray-400 mt-1">או גרור קובץ לכאן</span>
                                </>
                            )}
                        </div>

                        <div className="relative flex items-center gap-2">
                            <div className="h-px bg-gray-100 flex-1"></div>
                            <span className="text-xs text-gray-400 font-medium">או לפי קישור</span>
                            <div className="h-px bg-gray-100 flex-1"></div>
                        </div>

                        {/* URL Input */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="https://example.com/image.jpg"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                            <button
                                onClick={addImageByUrl}
                                disabled={!imageUrl}
                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 disabled:opacity-50 transition-colors"
                            >
                                <Upload className="w-4 h-4 rotate-90" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

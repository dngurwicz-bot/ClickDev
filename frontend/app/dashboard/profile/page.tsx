'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Camera, Upload, Loader2, Save } from 'lucide-react'
import { toast } from 'react-hot-toast'
import GlobalLoader from '@/components/ui/GlobalLoader'

export default function ProfilePage() {
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUser(user)
                setAvatarUrl(user.user_metadata?.avatar_url || null)
            }
            setLoading(false)
        }
        getUser()
    }, [])

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = event.target.files?.[0]
            if (!file) return

            setUploading(true)

            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${user.id}/${fileName}`

            // Ensure bucket exists or use standard 'avatars'
            // We assume 'avatars-public' or similar exists, or we might need to handle it.
            // Let's try 'avatars' first.
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // 3. Update User Metadata
            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            })

            if (updateError) throw updateError

            setAvatarUrl(publicUrl)
            toast.success('תמונת הפרופיל עודכנה בהצלחה')

            // Reload window to update sidebar (simple way)
            window.location.reload()

        } catch (error: any) {
            console.error('Error uploading avatar:', error)
            toast.error('שגיאה בהעלאת התמונה')
        } finally {
            setUploading(false)
        }
    }

    if (loading) return <GlobalLoader />

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-8 text-text-primary">הפרופיל שלי</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt="Profile"
                                className="w-32 h-32 rounded-full object-cover border-4 border-gray-50"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-50 text-gray-400">
                                <User className="w-16 h-16" />
                            </div>
                        )}

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors shadow-lg"
                        >
                            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                        </button>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>
                    <p className="mt-4 text-sm text-text-secondary">לחץ על המצלמה כדי לשנות תמונה</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">שם מלא</label>
                        <input
                            type="text"
                            value={
                                user?.user_metadata?.full_name ||
                                (user?.user_metadata?.first_name && user?.user_metadata?.last_name
                                    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                                    : '') ||
                                ''
                            }
                            readOnly
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-text-primary focus:outline-none cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">אימייל</label>
                        <input
                            type="email"
                            value={user?.email || ''}
                            readOnly
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-text-primary focus:outline-none cursor-not-allowed"
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs text-text-muted">
                            * לא ניתן לשנות פרטים אישיים במערכת זו. לשינוי פרטים נוספים אנא פנה למנהל המערכת.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

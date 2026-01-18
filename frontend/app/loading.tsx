import { Logo } from '@/components/ui/logo';
import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm gap-8 transition-all duration-500">
            <div className="animate-pulse scale-110">
                <Logo />
            </div>

            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-[#00A896] animate-spin" />
                <p className="text-sm font-medium text-gray-400/80 animate-pulse tracking-wide">
                    ...טוען נתונים
                </p>
            </div>
        </div>
    );
}

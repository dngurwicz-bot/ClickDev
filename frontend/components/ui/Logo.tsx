import React from "react";
import { cn } from "@/lib/utils";

export const Logo = ({ className, variant = 'default' }: { className?: string; variant?: 'default' | 'white' }) => {
  const isWhite = variant === 'white'
  
  return (
    <div className={cn("flex items-center gap-3 font-sans select-none", className)} dir="ltr">
      <div className={cn(
        "text-[28px] font-black tracking-tight leading-none",
        isWhite ? "text-white" : "text-[#2C3E50]"
      )}>
        CLICK<span className={isWhite ? "text-[#00A896]" : "text-[#00A896]"}>.</span>
      </div>
      <div className={cn("h-5 w-[1px]", isWhite ? "bg-white/30" : "bg-[#BDC3C7]")} />
      <div className={cn(
        "text-[12px] font-medium leading-tight text-left",
        isWhite ? "text-white/80" : "text-[#7F8C8D]"
      )}>
        DNG<br />HUB
      </div>
    </div>
  );
};

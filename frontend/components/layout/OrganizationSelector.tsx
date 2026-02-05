'use client'

import React from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { Building2 } from 'lucide-react'

export function OrganizationSelector() {
    const { currentOrg, organizations, setCurrentOrg, isLoading } = useOrganization()

    if (isLoading) {
        return <div className="w-40 h-8 bg-white/10 animate-pulse rounded" />
    }

    if (!organizations || organizations.length === 0) {
        return null
    }

    return (
        <Select
            value={currentOrg?.id}
            onValueChange={(value) => {
                const org = organizations.find(o => o.id === value)
                if (org) setCurrentOrg(org)
            }}
        >
            <SelectTrigger className="w-[180px] h-8 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:ring-0 focus:ring-offset-0 hover:bg-white/20 transition-colors">
                <div className="flex items-center gap-2 truncate">
                    <Building2 className="w-3.5 h-3.5 opacity-70" />
                    <SelectValue placeholder="בחר ארגון" />
                </div>
            </SelectTrigger>
            <SelectContent align="end" className="bg-[#1a2e3b] border-white/10 text-white">
                {organizations.map((org) => (
                    <SelectItem
                        key={org.id}
                        value={org.id}
                        className="focus:bg-white/10 focus:text-white cursor-pointer"
                    >
                        {org.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

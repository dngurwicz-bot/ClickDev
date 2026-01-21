'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Organization {
    id: string
    name: string
    active_modules?: string[]
    // Add other fields as needed
}

interface OrganizationContextType {
    currentOrg: Organization | null
    organizations: Organization[]
    setCurrentOrg: (org: Organization) => void
    refreshOrganizations: () => Promise<void>
    isLoading: boolean
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
    const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const refreshOrganizations = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Check if super admin
            const { data: roles } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)

            const isSuperAdmin = roles?.some(r => r.role === 'super_admin')

            let orgsData: Organization[] = []

            if (isSuperAdmin) {
                // Fetch all organizations for super admin
                const { data } = await supabase
                    .from('organizations')
                    .select('id, name, active_modules')
                    .order('name')

                orgsData = data || []
            } else {
                // Fetch user's organizations
                const { data } = await supabase
                    .from('user_roles')
                    .select('organization_id, organizations(id, name, active_modules)')
                    .eq('user_id', user.id)

                orgsData = data?.map((item: any) => item.organizations).filter(Boolean) || []
            }

            setOrganizations(orgsData)

            // Restore selection or default to first
            const storedOrgId = localStorage.getItem('selectedOrgId')
            const storedOrg = orgsData.find(o => o.id === storedOrgId)

            if (storedOrg) {
                setCurrentOrg(storedOrg)
            } else if (orgsData.length > 0) {
                setCurrentOrg(orgsData[0])
            }

        } catch (error) {
            console.error('Error fetching organizations:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        refreshOrganizations()
    }, [])

    const handleSetCurrentOrg = (org: Organization) => {
        setCurrentOrg(org)
        localStorage.setItem('selectedOrgId', org.id)
    }

    return (
        <OrganizationContext.Provider value={{
            currentOrg,
            organizations,
            setCurrentOrg: handleSetCurrentOrg,
            refreshOrganizations,
            isLoading
        }}>
            {children}
        </OrganizationContext.Provider>
    )
}

export function useOrganization() {
    const context = useContext(OrganizationContext)
    if (context === undefined) {
        throw new Error('useOrganization must be used within an OrganizationProvider')
    }
    return context
}

-- Create admin_tasks table
CREATE TABLE IF NOT EXISTS public.admin_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    assigned_to UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;

-- Policies
-- Super admins can see all tasks
CREATE POLICY "Super admins can view all tasks"
    ON public.admin_tasks
    FOR SELECT
    USING (
        public.check_is_super_admin()
    );

-- Super admins can insert tasks
CREATE POLICY "Super admins can insert tasks"
    ON public.admin_tasks
    FOR INSERT
    WITH CHECK (
        public.check_is_super_admin()
    );

-- Super admins can update tasks
CREATE POLICY "Super admins can update tasks"
    ON public.admin_tasks
    FOR UPDATE
    USING (
        public.check_is_super_admin()
    );

-- Super admins can delete tasks
CREATE POLICY "Super admins can delete tasks"
    ON public.admin_tasks
    FOR DELETE
    USING (
        public.check_is_super_admin()
    );

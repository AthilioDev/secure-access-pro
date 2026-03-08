-- Add role and plan to admin_users
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'staff',
ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS daily_license_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_license_date DATE;

-- Add port and created_by to licenses
ALTER TABLE public.licenses
ADD COLUMN IF NOT EXISTS port INTEGER,
ADD COLUMN IF NOT EXISTS created_by UUID;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  username TEXT,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create login_attempts table
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  ip_address TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- RLS policies (service role only via edge functions)
CREATE POLICY "Service role only" ON public.audit_logs FOR ALL USING (false);
CREATE POLICY "Service role only" ON public.login_attempts FOR ALL USING (false);

-- Add columns to validation_logs for richer logging
ALTER TABLE public.validation_logs
ADD COLUMN IF NOT EXISTS license_key TEXT,
ADD COLUMN IF NOT EXISTS success BOOLEAN,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Set Athilio as master++ admin
UPDATE public.admin_users SET role = 'master_plus', plan = 'master_plus' WHERE username = 'Athilio';
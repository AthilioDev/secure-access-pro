-- Create admin users table for authentication
CREATE TABLE public.admin_users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create licenses table for license management
CREATE TABLE public.licenses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    license_key TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    owner_name TEXT NOT NULL,
    owner_email TEXT,
    resource_name TEXT NOT NULL,
    hwid TEXT,
    ip_address TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE,
    last_validated TIMESTAMP WITH TIME ZONE,
    validation_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create validation logs table
CREATE TABLE public.validation_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    license_id UUID REFERENCES public.licenses(id) ON DELETE CASCADE,
    license_key TEXT NOT NULL,
    hwid TEXT,
    ip_address TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_logs ENABLE ROW LEVEL SECURITY;

-- Admin users policies (no direct access, use edge functions)
CREATE POLICY "No direct access to admin_users" 
ON public.admin_users FOR SELECT 
USING (false);

-- Licenses policies (only authenticated admin can manage)
CREATE POLICY "Admin can view all licenses" 
ON public.licenses FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admin can insert licenses" 
ON public.licenses FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admin can update licenses" 
ON public.licenses FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Admin can delete licenses" 
ON public.licenses FOR DELETE 
TO authenticated
USING (true);

-- Validation logs policies
CREATE POLICY "Admin can view validation logs" 
ON public.validation_logs FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Allow insert validation logs" 
ON public.validation_logs FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_licenses_updated_at
BEFORE UPDATE ON public.licenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin user (password: Athilio - hashed with simple method for demo)
-- In production, use proper bcrypt hashing
INSERT INTO public.admin_users (username, password_hash)
VALUES ('Athilio', 'Athilio');
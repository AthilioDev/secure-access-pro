
-- Create user_webhooks table for webhook configuration per user
CREATE TABLE IF NOT EXISTS public.user_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  webhook_url TEXT NOT NULL,
  event_type TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS policy - service role only (accessed via edge functions)
CREATE POLICY "Service role only" ON public.user_webhooks FOR ALL USING (false);

-- Add index for faster lookups
CREATE INDEX idx_user_webhooks_user_id ON public.user_webhooks(user_id);
CREATE INDEX idx_user_webhooks_event_type ON public.user_webhooks(event_type);


CREATE TABLE public.discord_bots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bot_name TEXT NOT NULL DEFAULT 'Meu Bot',
  bot_token_encrypted TEXT NOT NULL,
  log_channel_id TEXT,
  ticket_category_id TEXT,
  status TEXT NOT NULL DEFAULT 'offline',
  is_running BOOLEAN NOT NULL DEFAULT false,
  tickets_open INTEGER NOT NULL DEFAULT 0,
  last_started_at TIMESTAMP WITH TIME ZONE,
  last_stopped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.discord_bots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.discord_bots AS RESTRICTIVE FOR ALL USING (false);

CREATE TRIGGER update_discord_bots_updated_at
  BEFORE UPDATE ON public.discord_bots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

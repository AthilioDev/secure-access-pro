-- RLS for admin_users: only service role can access (edge functions use service role key)
CREATE POLICY "Service role access only" ON public.admin_users
  FOR ALL USING (false);

-- RLS for validation_logs: allow inserts from service role, no public access
CREATE POLICY "Service role access only" ON public.validation_logs
  FOR ALL USING (false);
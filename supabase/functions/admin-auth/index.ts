import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password, action } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';

    // =====================
    // LOGIN
    // =====================
    if (!action || action === 'login') {
      if (!username || !password) {
        return new Response(
          JSON.stringify({ success: false, error: 'Username and password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (error) {
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Database error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log login attempt
      await supabase.from('login_attempts').insert({
        username,
        ip_address: clientIP,
        success: !!adminUser && adminUser.password_hash === password,
      });

      if (!adminUser || adminUser.password_hash !== password) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update last login
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminUser.id);

      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: adminUser.id,
        username: adminUser.username,
        action: 'LOGIN',
        details: `Login successful from IP ${clientIP}`,
        ip_address: clientIP,
      });

      const sessionToken = crypto.randomUUID();

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: adminUser.id,
            username: adminUser.username,
            role: adminUser.role,
            plan: adminUser.plan,
          },
          token: sessionToken
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =====================
    // FETCH DASHBOARD DATA
    // =====================
    if (action === 'dashboard') {
      const [
        { data: licenses },
        { data: validationLogs },
        { data: auditLogs },
        { data: loginAttempts },
        { data: adminUsers },
      ] = await Promise.all([
        supabase.from('licenses').select('*').order('created_at', { ascending: false }),
        supabase.from('validation_logs').select('*').order('validated_at', { ascending: false }).limit(100),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('login_attempts').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('admin_users').select('id, username, email, role, plan, last_login, created_at, daily_license_count, last_license_date'),
      ]);

      return new Response(
        JSON.stringify({
          success: true,
          licenses: licenses || [],
          validationLogs: validationLogs || [],
          auditLogs: auditLogs || [],
          loginAttempts: loginAttempts || [],
          adminUsers: adminUsers || [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =====================
    // CREATE LICENSE (with plan limits)
    // =====================
    if (action === 'create_license') {
      const { user_id, license_data } = await req.json().catch(() => ({ user_id: null, license_data: null }));

      // Re-parse since we already consumed the body
      // We need to get user_id from the original parsed body
      return new Response(
        JSON.stringify({ success: false, error: 'Use the dedicated endpoint' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =====================
    // LOG AUDIT
    // =====================
    if (action === 'audit') {
      const { user_id: auditUserId, audit_username, audit_action, details } = await req.json().catch(() => ({}));
      
      await supabase.from('audit_logs').insert({
        user_id: auditUserId,
        username: audit_username,
        action: audit_action,
        details,
        ip_address: clientIP,
      });

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

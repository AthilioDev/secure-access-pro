import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WEBHOOK_EVENTS = new Set([
  'license_created',
  'license_edited',
  'license_suspended',
  'license_revoked',
  'license_expired',
  'license_validated',
  'license_deleted',
]);

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';

    // =====================
    // LOGIN
    // =====================
    if (!action || action === 'login') {
      const { username, password } = body;
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

      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminUser.id);

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
    // FETCH DASHBOARD DATA (user-scoped)
    // =====================
    if (action === 'dashboard') {
      const { user_id, user_role } = body;
      const isAdmin = user_role === 'master_plus' || user_role === 'master' || user_role === 'admin';

      // Licenses: filter by created_by unless admin
      let licensesQuery = supabase.from('licenses').select('*').order('created_at', { ascending: false });
      if (!isAdmin && user_id) {
        licensesQuery = licensesQuery.eq('created_by', user_id);
      }

      const [
        { data: licenses },
        { data: validationLogs },
        { data: auditLogs },
        { data: loginAttempts },
        { data: adminUsers },
        { data: webhooks },
      ] = await Promise.all([
        licensesQuery,
        supabase.from('validation_logs').select('*').order('validated_at', { ascending: false }).limit(200),
        isAdmin
          ? supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200)
          : supabase.from('audit_logs').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(100),
        isAdmin
          ? supabase.from('login_attempts').select('*').order('created_at', { ascending: false }).limit(100)
          : { data: [] },
        isAdmin
          ? supabase.from('admin_users').select('id, username, email, role, plan, last_login, created_at, daily_license_count, last_license_date')
          : { data: [] },
        user_id
          ? supabase.from('user_webhooks').select('*').eq('user_id', user_id).order('created_at', { ascending: false })
          : { data: [] },
      ]);

      return new Response(
        JSON.stringify({
          success: true,
          licenses: licenses || [],
          validationLogs: validationLogs || [],
          auditLogs: auditLogs || [],
          loginAttempts: loginAttempts || [],
          adminUsers: adminUsers || [],
          webhooks: webhooks || [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =====================
    // LOG AUDIT
    // =====================
    if (action === 'audit') {
      const { user_id: auditUserId, audit_username, audit_action, details } = body;
      
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

    // =====================
    // UPDATE USER ROLE (admin only)
    // =====================
    if (action === 'update_user_role') {
      const { target_user_id, new_role, new_plan, admin_user_id, admin_username } = body;
      
      if (!target_user_id || !new_role || !new_plan) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('admin_users')
        .update({ role: new_role, plan: new_plan })
        .eq('id', target_user_id);

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to update user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabase.from('audit_logs').insert({
        user_id: admin_user_id,
        username: admin_username,
        action: 'UPDATE_USER_ROLE',
        details: `Changed user ${target_user_id} to role=${new_role}, plan=${new_plan}`,
        ip_address: clientIP,
      });

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =====================
    // WEBHOOK MANAGEMENT
    // =====================
    if (action === 'save_webhook') {
      const { user_id: whUserId, webhook_url, event_type, enabled, webhook_id } = body;

      if (!whUserId || !event_type) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (webhook_id) {
        // Update existing
        const { error } = await supabase
          .from('user_webhooks')
          .update({ webhook_url, enabled, updated_at: new Date().toISOString() })
          .eq('id', webhook_id)
          .eq('user_id', whUserId);

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to update webhook' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        // Create new
        const { error } = await supabase
          .from('user_webhooks')
          .insert({ user_id: whUserId, webhook_url, event_type, enabled: enabled !== false });

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to create webhook' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete_webhook') {
      const { webhook_id: delId, user_id: delUserId } = body;
      
      const { error } = await supabase
        .from('user_webhooks')
        .delete()
        .eq('id', delId)
        .eq('user_id', delUserId);

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to delete webhook' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =====================
    // FIRE WEBHOOKS (called internally from verify-license)
    // =====================
    if (action === 'fire_webhooks') {
      const { event_type: evtType, license_data, created_by_user_id } = body;

      if (!evtType) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing event_type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get webhooks for the user who created this license
      let userId = created_by_user_id;
      
      if (!userId && license_data?.license_key) {
        const { data: lic } = await supabase
          .from('licenses')
          .select('created_by')
          .eq('license_key', license_data.license_key)
          .maybeSingle();
        userId = lic?.created_by;
      }

      if (!userId) {
        return new Response(
          JSON.stringify({ success: true, fired: 0 }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: hooks } = await supabase
        .from('user_webhooks')
        .select('*')
        .eq('user_id', userId)
        .eq('event_type', evtType)
        .eq('enabled', true);

      let fired = 0;
      if (hooks && hooks.length > 0) {
        for (const hook of hooks) {
          try {
            await fetch(hook.webhook_url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: evtType,
                timestamp: new Date().toISOString(),
                data: license_data || {},
              }),
            });
            fired++;
          } catch (e) {
            console.error('Webhook fire error:', e);
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, fired }),
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

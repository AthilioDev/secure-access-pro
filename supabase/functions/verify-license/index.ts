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
    const { license_key, server_ip, server_port, script_name } = await req.json();

    if (!license_key || !script_name) {
      return new Response(
        JSON.stringify({ valid: false, expired: false, owner: null, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find license
    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', license_key)
      .eq('resource_name', script_name)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ valid: false, expired: false, owner: null, error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Helper to fire webhooks
    const fireWebhook = async (eventType: string, data: Record<string, unknown>) => {
      try {
        await supabase.functions.invoke('admin-auth', {
          body: {
            action: 'fire_webhooks',
            event_type: eventType,
            license_data: data,
            created_by_user_id: license?.created_by || null,
          }
        });
      } catch (e) {
        console.error('Webhook fire error:', e);
      }
    };

    // License not found
    if (!license) {
      await supabase.from('validation_logs').insert({
        license_key,
        success: false,
        ip_address: server_ip || null,
        error_message: 'LICENSE_NOT_FOUND',
        result: 'FAILED',
      });

      return new Response(
        JSON.stringify({ valid: false, expired: false, owner: null, error: 'LICENSE_NOT_FOUND' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    const isExpired = license.expires_at ? new Date(license.expires_at) < new Date() : false;

    if (license.status !== 'active' || isExpired) {
      const errorMsg = isExpired ? 'LICENSE_EXPIRED' : `LICENSE_${license.status.toUpperCase()}`;

      if (isExpired && license.status === 'active') {
        await supabase.from('licenses').update({ status: 'expired' }).eq('id', license.id);
        await fireWebhook('license_expired', { license_key, owner: license.owner_name, resource: license.resource_name });
      }

      await supabase.from('validation_logs').insert({
        license_key,
        license_id: license.id,
        success: false,
        ip_address: server_ip || null,
        error_message: errorMsg,
        result: 'FAILED',
      });

      return new Response(
        JSON.stringify({ valid: false, expired: isExpired, owner: license.owner_name, error: errorMsg }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check IP whitelist
    if (license.ip_address && server_ip && license.ip_address !== server_ip) {
      await supabase.from('validation_logs').insert({
        license_key,
        license_id: license.id,
        success: false,
        ip_address: server_ip,
        error_message: 'IP_MISMATCH',
        result: 'FAILED',
      });

      return new Response(
        JSON.stringify({ valid: false, expired: false, owner: license.owner_name, error: 'IP_MISMATCH' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check port whitelist
    if (license.port && server_port && license.port !== server_port) {
      await supabase.from('validation_logs').insert({
        license_key,
        license_id: license.id,
        success: false,
        ip_address: server_ip,
        error_message: 'PORT_MISMATCH',
        result: 'FAILED',
      });

      return new Response(
        JSON.stringify({ valid: false, expired: false, owner: license.owner_name, error: 'PORT_MISMATCH' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // License is valid — update stats
    await supabase
      .from('licenses')
      .update({
        last_validated: new Date().toISOString(),
        validation_count: (license.validation_count || 0) + 1,
        ip_address: server_ip || license.ip_address,
        port: server_port || license.port,
      })
      .eq('id', license.id);

    // Log successful validation
    await supabase.from('validation_logs').insert({
      license_key,
      license_id: license.id,
      success: true,
      ip_address: server_ip || null,
      result: 'SUCCESS',
    });

    // Fire webhook for successful validation
    await fireWebhook('license_validated', {
      license_key,
      owner: license.owner_name,
      resource: license.resource_name,
      ip: server_ip,
      port: server_port,
    });

    return new Response(
      JSON.stringify({ valid: true, expired: false, owner: license.owner_name }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ valid: false, expired: false, owner: null, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

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
    const { license_key, server_ip, script_name } = await req.json();

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

    // License not found
    if (!license) {
      // Log failed validation
      await supabase.from('validation_logs').insert({
        license_key,
        success: false,
        hwid: null,
        ip_address: server_ip || null,
        error_message: 'LICENSE_NOT_FOUND',
      });

      return new Response(
        JSON.stringify({ valid: false, expired: false, owner: null, error: 'LICENSE_NOT_FOUND' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    const isExpired = license.expires_at ? new Date(license.expires_at) < new Date() : false;

    // Check status
    if (license.status !== 'active' || isExpired) {
      const errorMsg = isExpired ? 'LICENSE_EXPIRED' : `LICENSE_${license.status.toUpperCase()}`;
      
      // Update status to expired if needed
      if (isExpired && license.status === 'active') {
        await supabase
          .from('licenses')
          .update({ status: 'expired' })
          .eq('id', license.id);
      }

      // Log failed validation
      await supabase.from('validation_logs').insert({
        license_key,
        license_id: license.id,
        success: false,
        ip_address: server_ip || null,
        error_message: errorMsg,
      });

      return new Response(
        JSON.stringify({ valid: false, expired: isExpired, owner: license.owner_name, error: errorMsg }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check IP whitelist (if IP is set on license, only that IP can use it)
    if (license.ip_address && server_ip && license.ip_address !== server_ip) {
      await supabase.from('validation_logs').insert({
        license_key,
        license_id: license.id,
        success: false,
        ip_address: server_ip,
        error_message: 'IP_MISMATCH',
      });

      return new Response(
        JSON.stringify({ valid: false, expired: false, owner: license.owner_name, error: 'IP_MISMATCH' }),
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
      })
      .eq('id', license.id);

    // Log successful validation
    await supabase.from('validation_logs').insert({
      license_key,
      license_id: license.id,
      success: true,
      ip_address: server_ip || null,
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
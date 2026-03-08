import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter (resets per cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   req.headers.get('cf-connecting-ip') || 'unknown';

  try {
    // Rate limit check
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Rate limit exceeded. Try again later.', error: 'RATE_LIMITED' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { license_key, server_ip, server_port, script_name, hwid } = await req.json();

    if (!license_key || !script_name) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Missing required fields', error: 'MISSING_FIELDS' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      return respond(false, 'Database error', 'DATABASE_ERROR', null, supabase, license_key, clientIP, script_name, hwid, startTime);
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
      await logVerification(supabase, license_key, clientIP, script_name, hwid, false, 'LICENSE_NOT_FOUND', startTime);
      return respond(false, 'License not found', 'LICENSE_NOT_FOUND', null, supabase, license_key, clientIP, script_name, hwid, startTime, true);
    }

    // Check if expired
    const now = new Date();
    const isExpired = license.expires_at ? new Date(license.expires_at) < now : false;
    const expiresAt = license.expires_at ? new Date(license.expires_at) : null;
    const daysRemaining = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 86400000)) : null;

    if (license.status !== 'active' || isExpired) {
      const errorMsg = isExpired ? 'LICENSE_EXPIRED' : `LICENSE_${license.status.toUpperCase()}`;

      if (isExpired && license.status === 'active') {
        await supabase.from('licenses').update({ status: 'expired' }).eq('id', license.id);
        await fireWebhook('license_expired', { license_key, owner: license.owner_name, resource: license.resource_name });
      }

      await logVerification(supabase, license_key, clientIP, script_name, hwid, false, errorMsg, startTime, license.id);
      return new Response(
        JSON.stringify({
          valid: false, message: errorMsg, error: errorMsg,
          expiration_date: license.expires_at, days_remaining: 0,
          script_name: license.resource_name, owner: license.owner_name,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check HWID
    if (hwid && license.hwid && license.hwid !== hwid) {
      await logVerification(supabase, license_key, clientIP, script_name, hwid, false, 'HWID_MISMATCH', startTime, license.id);
      return new Response(
        JSON.stringify({ valid: false, message: 'Hardware ID mismatch', error: 'HWID_MISMATCH', owner: license.owner_name }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check IP whitelist
    if (license.ip_address && server_ip && license.ip_address !== server_ip) {
      await logVerification(supabase, license_key, clientIP, script_name, hwid, false, 'IP_MISMATCH', startTime, license.id);
      return new Response(
        JSON.stringify({ valid: false, message: 'IP address mismatch', error: 'IP_MISMATCH', owner: license.owner_name }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check port
    if (license.port && server_port && license.port !== server_port) {
      await logVerification(supabase, license_key, clientIP, script_name, hwid, false, 'PORT_MISMATCH', startTime, license.id);
      return new Response(
        JSON.stringify({ valid: false, message: 'Port mismatch', error: 'PORT_MISMATCH', owner: license.owner_name }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // License is valid — update stats
    const updates: Record<string, unknown> = {
      last_validated: now.toISOString(),
      validation_count: (license.validation_count || 0) + 1,
    };
    if (server_ip && !license.ip_address) updates.ip_address = server_ip;
    if (server_port && !license.port) updates.port = server_port;
    if (hwid && !license.hwid) updates.hwid = hwid;

    await supabase.from('licenses').update(updates).eq('id', license.id);

    // Log successful verification
    await logVerification(supabase, license_key, clientIP, script_name, hwid, true, null, startTime, license.id);

    // Fire webhook
    await fireWebhook('license_validated', {
      license_key, owner: license.owner_name, resource: license.resource_name,
      ip: server_ip, port: server_port,
    });

    return new Response(
      JSON.stringify({
        valid: true,
        message: 'License valid',
        owner: license.owner_name,
        expiration_date: license.expires_at,
        days_remaining: daysRemaining,
        script_name: license.resource_name,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ valid: false, message: 'Internal server error', error: 'INTERNAL_ERROR' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function logVerification(
  supabase: any, licenseKey: string, ip: string, scriptName: string,
  hwid: string | null, success: boolean, errorMsg: string | null,
  startTime: number, licenseId?: string, skipLog?: boolean
) {
  if (skipLog) return;
  const responseTime = Date.now() - startTime;
  try {
    await supabase.from('validation_logs').insert({
      license_key: licenseKey,
      license_id: licenseId || null,
      ip_address: ip,
      success,
      error_message: errorMsg,
      result: success ? 'SUCCESS' : 'FAILED',
    });
  } catch (e) {
    console.error('Log insert error:', e);
  }
}

function respond(
  valid: boolean, message: string, error: string | null, owner: string | null,
  _supabase: any, _key: string, _ip: string, _script: string, _hwid: string | null,
  _start: number, _logged = false
) {
  return new Response(
    JSON.stringify({ valid, message, error, owner }),
    { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json' } }
  );
}

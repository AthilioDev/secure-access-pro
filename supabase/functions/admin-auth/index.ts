import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WEBHOOK_EVENTS = new Set([
  'license_created', 'license_edited', 'license_suspended',
  'license_revoked', 'license_expired', 'license_validated',
  'license_deleted',
]);

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };
const ok = (data: unknown) => new Response(JSON.stringify(data), { status: 200, headers: jsonHeaders });
const err = (msg: string, status = 400) => new Response(JSON.stringify({ success: false, error: msg }), { status, headers: jsonHeaders });

function getSupabase() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
}

const TOKEN_KEY = 'athilio-auth-bot-key-2024';
function obfuscateToken(token: string): string {
  return btoa(token.split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ TOKEN_KEY.charCodeAt(i % TOKEN_KEY.length))).join(''));
}

// Brute force protection
const loginAttemptCache = new Map<string, { count: number; blockedUntil: number }>();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action } = body;
    const supabase = getSupabase();
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip') || 'unknown';

    // ── LOGIN ──
    if (!action || action === 'login') {
      const { username, password } = body;
      if (!username || !password) return err('Username and password are required');

      // Check brute force
      const key = `${username}:${clientIP}`;
      const attempt = loginAttemptCache.get(key);
      if (attempt && attempt.blockedUntil > Date.now()) {
        const mins = Math.ceil((attempt.blockedUntil - Date.now()) / 60000);
        return err(`Too many attempts. Try again in ${mins} minutes.`, 429);
      }

      const { data: adminUser, error } = await supabase
        .from('admin_users').select('*').eq('username', username).maybeSingle();

      if (error) return err('Database error', 500);

      const success = !!adminUser && adminUser.password_hash === password;

      await supabase.from('login_attempts').insert({
        username, ip_address: clientIP, success,
      });

      if (!success) {
        const current = loginAttemptCache.get(key) || { count: 0, blockedUntil: 0 };
        current.count++;
        if (current.count >= 5) {
          current.blockedUntil = Date.now() + 15 * 60 * 1000;
          current.count = 0;
        }
        loginAttemptCache.set(key, current);
        return err('Invalid credentials', 401);
      }

      // Reset on success
      loginAttemptCache.delete(key);

      await supabase.from('admin_users').update({ last_login: new Date().toISOString() }).eq('id', adminUser.id);
      await supabase.from('audit_logs').insert({
        user_id: adminUser.id, username: adminUser.username,
        action: 'LOGIN', details: `Login from ${clientIP}`, ip_address: clientIP,
      });

      return ok({
        success: true,
        user: { id: adminUser.id, username: adminUser.username, role: adminUser.role, plan: adminUser.plan },
        token: crypto.randomUUID(),
      });
    }

    // ── REGISTER ──
    if (action === 'register') {
      const { username, password, email } = body;
      if (!username || !password || !email) return err('All fields are required');
      if (username.length < 3) return err('Username must be at least 3 characters');
      if (password.length < 6) return err('Password must be at least 6 characters');

      const { data: existing } = await supabase
        .from('admin_users').select('id').or(`username.eq.${username},email.eq.${email}`).maybeSingle();

      if (existing) return err('Username or email already exists');

      const { data: newUser, error: insertErr } = await supabase
        .from('admin_users').insert({
          username, email, password_hash: password,
          role: 'staff', plan: 'standard',
        }).select('id, username, role, plan').single();

      if (insertErr) return err('Failed to create account', 500);

      await supabase.from('audit_logs').insert({
        user_id: newUser.id, username: newUser.username,
        action: 'REGISTER', details: `New account created`, ip_address: clientIP,
      });

      return ok({
        success: true,
        user: { id: newUser.id, username: newUser.username, role: newUser.role, plan: newUser.plan },
        token: crypto.randomUUID(),
      });
    }

    // ── DASHBOARD ──
    if (action === 'dashboard') {
      const { user_id, user_role, admin_view } = body;
      const isAdminUser = ['master_plus', 'master', 'admin'].includes(user_role);
      const isAdminView = isAdminUser && admin_view === true;

      let licensesQuery = supabase.from('licenses').select('*').order('created_at', { ascending: false });
      if (!isAdminView && user_id) licensesQuery = licensesQuery.eq('created_by', user_id);

      let validationQuery: Promise<{ data: any[] | null }>;
      if (isAdminView) {
        validationQuery = supabase.from('validation_logs').select('*').order('validated_at', { ascending: false }).limit(500);
      } else if (user_id) {
        const { data: ul } = await supabase.from('licenses').select('license_key').eq('created_by', user_id).limit(1000);
        const keys = (ul || []).map((l: any) => l.license_key).filter(Boolean);
        validationQuery = keys.length > 0
          ? supabase.from('validation_logs').select('*').in('license_key', keys).order('validated_at', { ascending: false }).limit(500)
          : Promise.resolve({ data: [] });
      } else {
        validationQuery = Promise.resolve({ data: [] });
      }

      const [
        { data: licenses }, { data: validationLogs }, { data: auditLogs },
        { data: loginAttempts }, { data: adminUsers }, { data: webhooks }, { data: bots },
        { data: announcements }, { data: tickets },
      ] = await Promise.all([
        licensesQuery,
        validationQuery,
        isAdminView
          ? supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(500)
          : supabase.from('audit_logs').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(100),
        isAdminView
          ? supabase.from('login_attempts').select('*').order('created_at', { ascending: false }).limit(200)
          : Promise.resolve({ data: [] }),
        isAdminView
          ? supabase.from('admin_users').select('id, username, email, role, plan, last_login, created_at, daily_license_count, last_license_date')
          : Promise.resolve({ data: [] }),
        user_id
          ? supabase.from('user_webhooks').select('*').eq('user_id', user_id).order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
        isAdminView
          ? supabase.from('discord_bots').select('id, user_id, bot_name, log_channel_id, ticket_category_id, status, is_running, tickets_open, created_at').order('created_at', { ascending: false })
          : user_id
            ? supabase.from('discord_bots').select('id, user_id, bot_name, log_channel_id, ticket_category_id, status, is_running, tickets_open, created_at').eq('user_id', user_id).order('created_at', { ascending: false })
            : Promise.resolve({ data: [] }),
        supabase.from('announcements').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(50),
        isAdminView
          ? supabase.from('tickets').select('*').order('created_at', { ascending: false }).limit(200)
          : user_id
            ? supabase.from('tickets').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(50)
            : Promise.resolve({ data: [] }),
      ]);

      return ok({
        success: true,
        licenses: licenses || [], validationLogs: validationLogs || [],
        auditLogs: auditLogs || [], loginAttempts: loginAttempts || [],
        adminUsers: adminUsers || [], webhooks: webhooks || [],
        bots: bots || [], announcements: announcements || [],
        tickets: tickets || [],
      });
    }

    // ── AUDIT ──
    if (action === 'audit') {
      const { user_id: uid, audit_username, audit_action, details } = body;
      await supabase.from('audit_logs').insert({
        user_id: uid, username: audit_username, action: audit_action, details, ip_address: clientIP,
      });
      return ok({ success: true });
    }

    // ── UPDATE USER ROLE ──
    if (action === 'update_user_role') {
      const { target_user_id, new_role, new_plan, admin_user_id, admin_username } = body;
      if (!target_user_id || !new_role || !new_plan || !admin_user_id) return err('Missing fields');

      const { data: actor } = await supabase.from('admin_users').select('id, role').eq('id', admin_user_id).maybeSingle();
      if (!actor || actor.role !== 'master_plus') return err('Unauthorized', 403);

      const { error: upErr } = await supabase.from('admin_users').update({ role: new_role, plan: new_plan }).eq('id', target_user_id);
      if (upErr) return err('Failed to update user', 500);

      await supabase.from('audit_logs').insert({
        user_id: admin_user_id, username: admin_username,
        action: 'UPDATE_USER_ROLE', details: `User ${target_user_id} → role=${new_role}, plan=${new_plan}`,
        ip_address: clientIP,
      });
      return ok({ success: true });
    }

    // ── WEBHOOK MANAGEMENT ──
    if (action === 'save_webhook') {
      const { user_id: whUid, webhook_url, event_type, enabled, webhook_id } = body;
      if (!whUid || !event_type) return err('Missing fields');
      if (!WEBHOOK_EVENTS.has(event_type) && event_type !== 'all') return err('Invalid event type');

      if (webhook_url) {
        try { const u = new URL(webhook_url); if (!['http:', 'https:'].includes(u.protocol)) throw 0; }
        catch { return err('Invalid webhook URL'); }
      }

      if (webhook_id) {
        const { error: e } = await supabase.from('user_webhooks')
          .update({ webhook_url, enabled, updated_at: new Date().toISOString() })
          .eq('id', webhook_id).eq('user_id', whUid);
        if (e) return err('Failed to update webhook', 500);
      } else {
        const { error: e } = await supabase.from('user_webhooks')
          .insert({ user_id: whUid, webhook_url, event_type, enabled: enabled !== false });
        if (e) return err('Failed to create webhook', 500);
      }
      return ok({ success: true });
    }

    if (action === 'delete_webhook') {
      const { webhook_id: wid, user_id: wuid } = body;
      const { error: e } = await supabase.from('user_webhooks').delete().eq('id', wid).eq('user_id', wuid);
      if (e) return err('Failed to delete webhook', 500);
      return ok({ success: true });
    }

    // ── FIRE WEBHOOKS ──
    if (action === 'fire_webhooks') {
      const { event_type: evtType, license_data, created_by_user_id, initiator_user_id } = body;
      if (!evtType || (!WEBHOOK_EVENTS.has(evtType) && evtType !== 'all')) return err('Invalid event_type');

      let userId = created_by_user_id || initiator_user_id || null;
      if (!userId && license_data?.license_key) {
        const { data: lic } = await supabase.from('licenses').select('created_by').eq('license_key', license_data.license_key).maybeSingle();
        userId = lic?.created_by || null;
      }
      if (!userId) return ok({ success: true, fired: 0, failed: [] });

      const { data: hooks } = await supabase.from('user_webhooks').select('*')
        .eq('user_id', userId).in('event_type', [evtType, 'all']).eq('enabled', true);

      let fired = 0;
      const failed: Array<{ webhook_id: string; status?: number; error?: string }> = [];

      if (hooks && hooks.length > 0) {
        for (const hook of hooks) {
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              const payload = { event: evtType, timestamp: new Date().toISOString(), user_id: userId, data: license_data || {} };
              const isDiscord = hook.webhook_url.includes('discord.com/api/webhooks');
              const requestBody = isDiscord
                ? JSON.stringify({ content: `**Athilio Auth** · \`${evtType}\`\n\`\`\`json\n${JSON.stringify(payload, null, 2).slice(0, 1700)}\n\`\`\`` })
                : JSON.stringify(payload);

              const resp = await fetch(hook.webhook_url, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: requestBody,
              });
              if (resp.ok) { fired++; break; }
              if (attempt === 2) failed.push({ webhook_id: hook.id, status: resp.status });
            } catch (e) {
              if (attempt === 2) failed.push({ webhook_id: hook.id, error: String(e) });
            }
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          }
        }
      }
      return ok({ success: true, fired, failed });
    }

    // ── BOT MANAGEMENT ──
    if (action === 'save_bot') {
      const { user_id: buid, bot_name, bot_token, log_channel_id, ticket_category_id } = body;
      if (!buid || !bot_name || !bot_token) return err('Missing fields');

      const encrypted = obfuscateToken(bot_token);
      const { error: e } = await supabase.from('discord_bots').insert({
        user_id: buid, bot_name, bot_token_encrypted: encrypted,
        log_channel_id: log_channel_id || null, ticket_category_id: ticket_category_id || null,
      });
      if (e) return err('Failed to save bot', 500);

      await supabase.from('audit_logs').insert({
        user_id: buid, action: 'CREATE_BOT', details: `Bot: ${bot_name}`, ip_address: clientIP,
      });
      return ok({ success: true });
    }

    if (action === 'bot_action') {
      const { bot_id, bot_action: bact, user_id: buid, user_role: brole } = body;
      if (!bot_id || !bact) return err('Missing fields');

      const { data: bot } = await supabase.from('discord_bots').select('*').eq('id', bot_id).maybeSingle();
      if (!bot) return err('Bot not found', 404);

      const isOwner = bot.user_id === buid;
      const hasPermission = isOwner || ['staff', 'admin', 'master', 'master_plus'].includes(brole);
      if (!hasPermission) return err('Unauthorized', 403);

      if (bact === 'delete') {
        await supabase.from('discord_bots').delete().eq('id', bot_id);
        await supabase.from('discord_bot_logs').insert({ bot_id, action: 'delete', details: `Deleted by ${buid}` });
        await supabase.from('audit_logs').insert({
          user_id: buid, action: 'DELETE_BOT', details: `Bot: ${bot.bot_name}`, ip_address: clientIP,
        });
        return ok({ success: true });
      }

      const statusMap: Record<string, { status: string; is_running: boolean }> = {
        start: { status: 'online', is_running: true },
        stop: { status: 'offline', is_running: false },
        restart: { status: 'online', is_running: true },
      };
      const newStatus = statusMap[bact];
      if (!newStatus) return err('Invalid action');

      const updates: Record<string, unknown> = { ...newStatus };
      if (bact === 'start' || bact === 'restart') updates.last_started_at = new Date().toISOString();
      if (bact === 'stop') updates.last_stopped_at = new Date().toISOString();

      await supabase.from('discord_bots').update(updates).eq('id', bot_id);
      await supabase.from('discord_bot_logs').insert({ bot_id, action: bact, details: `By user ${buid}` });
      await supabase.from('audit_logs').insert({
        user_id: buid, action: `BOT_${bact.toUpperCase()}`, details: `Bot: ${bot.bot_name}`, ip_address: clientIP,
      });
      return ok({ success: true });
    }

    // ── ANNOUNCEMENTS ──
    if (action === 'create_announcement') {
      const { user_id: auid, user_role: arole, title, content, is_pinned, author_name } = body;
      if (!['staff', 'admin', 'master', 'master_plus'].includes(arole)) return err('Unauthorized', 403);
      if (!title || !content) return err('Title and content required');

      const { error: e } = await supabase.from('announcements').insert({
        title, content, author_id: auid, author_name: author_name || 'Staff', is_pinned: is_pinned || false,
      });
      if (e) return err('Failed to create announcement', 500);
      return ok({ success: true });
    }

    if (action === 'delete_announcement') {
      const { announcement_id, user_role: arole } = body;
      if (!['staff', 'admin', 'master', 'master_plus'].includes(arole)) return err('Unauthorized', 403);
      await supabase.from('announcements').delete().eq('id', announcement_id);
      return ok({ success: true });
    }

    // ── TICKETS ──
    if (action === 'create_ticket') {
      const { user_id: tuid, user_name, subject, priority } = body;
      if (!tuid || !subject) return err('Missing fields');

      const { data: ticket, error: e } = await supabase.from('tickets').insert({
        user_id: tuid, user_name: user_name || 'Usuário', subject, priority: priority || 'normal',
      }).select('*').single();
      if (e) return err('Failed to create ticket', 500);
      return ok({ success: true, ticket });
    }

    if (action === 'update_ticket') {
      const { ticket_id, status, assigned_to, assigned_name, user_role: trole } = body;
      if (!ticket_id) return err('Missing ticket_id');

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (status) updates.status = status;
      if (status === 'closed') updates.closed_at = new Date().toISOString();
      if (assigned_to) { updates.assigned_to = assigned_to; updates.assigned_name = assigned_name; }

      await supabase.from('tickets').update(updates).eq('id', ticket_id);
      return ok({ success: true });
    }

    if (action === 'get_ticket_messages') {
      const { ticket_id } = body;
      if (!ticket_id) return err('Missing ticket_id');

      const { data: messages } = await supabase.from('ticket_messages').select('*')
        .eq('ticket_id', ticket_id).order('created_at', { ascending: true });
      return ok({ success: true, messages: messages || [] });
    }

    if (action === 'send_ticket_message') {
      const { ticket_id, sender_id, sender_name, sender_role, message } = body;
      if (!ticket_id || !sender_id || !message) return err('Missing fields');

      const { error: e } = await supabase.from('ticket_messages').insert({
        ticket_id, sender_id, sender_name: sender_name || 'Usuário',
        sender_role: sender_role || 'client', message,
      });
      if (e) return err('Failed to send message', 500);

      // Update ticket status if staff replies
      if (['staff', 'admin', 'master', 'master_plus'].includes(sender_role)) {
        await supabase.from('tickets').update({
          status: 'in_progress', updated_at: new Date().toISOString(),
          assigned_to: sender_id, assigned_name: sender_name,
        }).eq('id', ticket_id);
      }

      return ok({ success: true });
    }

    return err('Unknown action');
  } catch (error) {
    console.error('Error:', error);
    return err('Internal server error', 500);
  }
});

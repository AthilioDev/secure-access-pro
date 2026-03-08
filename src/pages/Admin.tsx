import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Shield, LogOut, Plus, Key, Users, Activity,
  Trash2, Search, RefreshCw, Copy, Check,
  AlertCircle, CheckCircle, XCircle, Clock, Download,
  BarChart3, FileText, Bell, Bot,
  Settings, Webhook, Edit, Save, X,
  MoreHorizontal, Power, RotateCw, Hash, MessageSquare,
  ChevronLeft, ChevronRight, Megaphone, HeadphonesIcon,
  Send, Pin, ExternalLink, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getPlanLimits, getPlanLabel, getRoleLabel, generateLicenseKey } from "@/lib/auth";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip,
  PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer,
} from "recharts";

/* ─── Types ─── */
interface License {
  id: string; license_key: string; owner_name: string; owner_email: string | null;
  resource_name: string; hwid: string | null; ip_address: string | null;
  port: number | null; status: string; expires_at: string | null;
  last_validated: string | null; validation_count: number; created_at: string; created_by: string | null;
  notes: string | null; max_ips: number | null;
}
interface ValidationLog {
  id: string; license_id: string | null; license_key: string | null;
  ip_address: string | null; result: string | null; success: boolean | null;
  error_message: string | null; validated_at: string | null;
}
interface AuditLog {
  id: string; user_id: string | null; username: string | null; action: string;
  details: string | null; ip_address: string | null; created_at: string;
}
interface LoginAttempt {
  id: string; username: string; ip_address: string | null; success: boolean; created_at: string;
}
interface StaffUser {
  id: string; username: string; email: string; role: string; plan: string;
  last_login: string | null; created_at: string; daily_license_count: number; last_license_date: string | null;
}
interface WebhookConfig {
  id: string; user_id: string; webhook_url: string; event_type: string; enabled: boolean; created_at: string;
}
interface DiscordBot {
  id: string; user_id: string; bot_name: string; bot_token_encrypted: string;
  log_channel_id: string | null; ticket_category_id: string | null;
  status: string; is_running: boolean; tickets_open: number; created_at: string;
}
interface Announcement {
  id: string; title: string; content: string; author_id: string; author_name: string | null;
  is_pinned: boolean; created_at: string;
}
interface Ticket {
  id: string; user_id: string; user_name: string; subject: string; status: string;
  priority: string; assigned_to: string | null; assigned_name: string | null;
  created_at: string; closed_at: string | null;
}
interface TicketMessage {
  id: string; ticket_id: string; sender_id: string; sender_name: string;
  sender_role: string; message: string; created_at: string;
}

const WEBHOOK_EVENTS = [
  { value: 'all', label: 'Todos os Eventos' },
  { value: 'license_created', label: 'Criada' },
  { value: 'license_edited', label: 'Editada' },
  { value: 'license_suspended', label: 'Suspensa' },
  { value: 'license_revoked', label: 'Revogada' },
  { value: 'license_expired', label: 'Expirada' },
  { value: 'license_validated', label: 'Validada' },
  { value: 'license_deleted', label: 'Deletada' },
];

const PAGE_SIZE = 10;

/* ─── Helpers ─── */
const statusDot = (s: string) => {
  const c: Record<string, string> = { active: 'dot-active', suspended: 'dot-suspended', revoked: 'dot-revoked', expired: 'dot-expired', open: 'dot-active', in_progress: 'dot-suspended', closed: 'dot-expired' };
  return <span className={`dot ${c[s] || 'dot-expired'}`} />;
};
const statusLabel = (s: string) => {
  const m: Record<string, string> = { active: 'Ativa', suspended: 'Suspensa', revoked: 'Revogada', expired: 'Expirada', open: 'Aberto', in_progress: 'Em Andamento', closed: 'Fechado' };
  return m[s] || s;
};
const priorityLabel = (p: string) => {
  const m: Record<string, string> = { low: 'Baixa', normal: 'Normal', high: 'Alta', urgent: 'Urgente' };
  return m[p] || p;
};
const fmt = (d: string | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const fmtShort = (d: string | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};
const CHART_COLORS = ['hsl(0,0%,80%)', 'hsl(0,0%,60%)', 'hsl(0,0%,40%)', 'hsl(0,0%,30%)', 'hsl(0,0%,20%)'];

/* ─── Loading Skeleton ─── */
const TableSkeleton = () => (
  <div className="space-y-2 p-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex gap-3 items-center">
        <Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-20" /><Skeleton className="h-4 flex-1" />
      </div>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════ */
const Admin = () => {
  const { isAuthenticated, user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [licenses, setLicenses] = useState<License[]>([]);
  const [validationLogs, setValidationLogs] = useState<ValidationLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [bots, setBots] = useState<DiscordBot[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("licenses");
  const [showAdminControls, setShowAdminControls] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editPlan, setEditPlan] = useState("");
  const [logFilter, setLogFilter] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState("all");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvent, setNewWebhookEvent] = useState("");
  const [licPage, setLicPage] = useState(0);

  /* ─── Edit license state ─── */
  const [editingLicense, setEditingLicense] = useState<string | null>(null);
  const [editLicIp, setEditLicIp] = useState("");
  const [editLicPort, setEditLicPort] = useState("");
  const [editLicExpiry, setEditLicExpiry] = useState("");

  /* ─── Bot state ─── */
  const [isAddBotOpen, setIsAddBotOpen] = useState(false);
  const [newBotName, setNewBotName] = useState("");
  const [newBotToken, setNewBotToken] = useState("");
  const [newBotLogChannel, setNewBotLogChannel] = useState("");
  const [newBotTicketCat, setNewBotTicketCat] = useState("");

  /* ─── Announcement state ─── */
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annPinned, setAnnPinned] = useState(false);

  /* ─── Ticket state ─── */
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketPriority, setTicketPriority] = useState("normal");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketChatOpen, setTicketChatOpen] = useState(false);

  /* ─── Delete confirmation ─── */
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [newLic, setNewLic] = useState({
    owner_name: "", owner_email: "", resource_name: "",
    ip_address: "", port: "", status: "active", expires_at: "", notes: ""
  });

  const isAdmin = user?.role === 'master_plus' || user?.role === 'master' || user?.role === 'admin';
  const isStaffOrAbove = isAdmin || user?.role === 'staff';

  useEffect(() => { if (!authLoading && !isAuthenticated) navigate("/login"); }, [isAuthenticated, authLoading, navigate]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'dashboard', user_id: user?.id, user_role: user?.role, admin_view: showAdminControls }
      });
      if (error) throw error;
      if (data?.success) {
        setLicenses(data.licenses || []);
        setValidationLogs(data.validationLogs || []);
        setAuditLogs(data.auditLogs || []);
        setLoginAttempts(data.loginAttempts || []);
        setStaffUsers(data.adminUsers || []);
        setWebhooks(data.webhooks || []);
        setBots(data.bots || []);
        setAnnouncements(data.announcements || []);
        setTickets(data.tickets || []);
      }
    } catch {
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.role, showAdminControls, toast]);

  useEffect(() => { if (isAuthenticated) fetchData(); }, [isAuthenticated, fetchData]);

  useEffect(() => {
    if (!showAdminControls && ['overview', 'users', 'logs'].includes(activeTab)) {
      setActiveTab('licenses');
    }
  }, [showAdminControls, activeTab]);

  // Realtime for tickets
  useEffect(() => {
    if (!selectedTicket) return;
    const channel = supabase
      .channel(`ticket-${selectedTicket.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${selectedTicket.id}` },
        (payload) => {
          setTicketMessages(prev => [...prev, payload.new as TicketMessage]);
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedTicket]);

  const copy = (k: string) => {
    navigator.clipboard.writeText(k); setCopiedKey(k);
    toast({ title: "Copiado!" });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const planLimit = user ? getPlanLimits(user.plan) : 5;
  const cu = staffUsers.find(s => s.id === user?.id);
  const isToday = cu?.last_license_date === new Date().toISOString().split('T')[0];
  const usedToday = isToday ? (cu?.daily_license_count || 0) : 0;
  const canCreate = planLimit === -1 || usedToday < planLimit;

  /* ─── Stats ─── */
  const todayStr = new Date().toISOString().split('T')[0];
  const validationsToday = validationLogs.filter(v => v.validated_at?.startsWith(todayStr)).length;

  const stats = useMemo(() => ({
    total: licenses.length,
    active: licenses.filter(l => l.status === 'active').length,
    suspended: licenses.filter(l => l.status === 'suspended').length,
    revoked: licenses.filter(l => l.status === 'revoked').length,
    expired: licenses.filter(l => l.status === 'expired').length,
    validations: licenses.reduce((a, l) => a + (l.validation_count || 0), 0),
    users: staffUsers.length,
    failedLogins: loginAttempts.filter(l => !l.success).length,
  }), [licenses, loginAttempts, staffUsers]);

  // Expiring soon badge
  const expiringSoon = useMemo(() => {
    const week = Date.now() + 7 * 86400000;
    return licenses.filter(l => l.status === 'active' && l.expires_at && new Date(l.expires_at).getTime() < week).length;
  }, [licenses]);

  /* ─── Charts data ─── */
  const validationsByDay = useMemo(() => {
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days[d.toISOString().split('T')[0]] = 0;
    }
    validationLogs.forEach(v => {
      const day = v.validated_at?.split('T')[0];
      if (day && day in days) days[day]++;
    });
    return Object.entries(days).map(([date, count]) => ({ date: date.slice(5), count }));
  }, [validationLogs]);

  const licensesByScript = useMemo(() => {
    const counts: Record<string, number> = {};
    licenses.forEach(l => { counts[l.resource_name] = (counts[l.resource_name] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [licenses]);

  const licensesByMonth = useMemo(() => {
    const months: Record<string, number> = {};
    licenses.forEach(l => {
      const m = l.created_at?.slice(0, 7);
      if (m) months[m] = (months[m] || 0) + 1;
    });
    return Object.entries(months).sort().slice(-6).map(([month, count]) => ({ month: month.slice(5), count }));
  }, [licenses]);

  /* ─── License CRUD ─── */
  const createLicense = async () => {
    if (!newLic.owner_name || !newLic.resource_name) { toast({ title: "Campos obrigatórios", variant: "destructive" }); return; }
    if (!canCreate) { toast({ title: "Limite diário atingido", variant: "destructive" }); return; }
    try {
      const key = generateLicenseKey();
      const { error } = await supabase.from('licenses').insert({
        license_key: key, owner_name: newLic.owner_name, owner_email: newLic.owner_email || null,
        resource_name: newLic.resource_name, ip_address: newLic.ip_address || null,
        port: newLic.port ? parseInt(newLic.port) : null, status: newLic.status,
        expires_at: newLic.expires_at || null, created_by: user?.id || null,
        notes: newLic.notes || null,
      });
      if (error) throw error;
      await supabase.functions.invoke('admin-auth', { body: { action: 'audit', user_id: user?.id, audit_username: user?.username, audit_action: 'CREATE_LICENSE', details: `${newLic.owner_name} - ${newLic.resource_name} - ${key}` } });
      await supabase.functions.invoke('admin-auth', { body: { action: 'fire_webhooks', event_type: 'license_created', created_by_user_id: user?.id, initiator_user_id: user?.id, license_data: { license_key: key, owner: newLic.owner_name, resource: newLic.resource_name } } });
      toast({ title: "Licença criada!", description: key });
      copy(key);
      setIsCreateOpen(false);
      setNewLic({ owner_name: "", owner_email: "", resource_name: "", ip_address: "", port: "", status: "active", expires_at: "", notes: "" });
      fetchData();
    } catch { toast({ title: "Erro ao criar licença", variant: "destructive" }); }
  };

  const setStatus = async (id: string, status: string) => {
    try {
      const lic = licenses.find(l => l.id === id);
      const { error } = await supabase.from('licenses').update({ status }).eq('id', id);
      if (error) throw error;
      await supabase.functions.invoke('admin-auth', { body: { action: 'audit', user_id: user?.id, audit_username: user?.username, audit_action: 'UPDATE_LICENSE_STATUS', details: `${id} → ${status}` } });
      const evtMap: Record<string, string> = { suspended: 'license_suspended', revoked: 'license_revoked', active: 'license_edited' };
      if (evtMap[status]) {
        await supabase.functions.invoke('admin-auth', { body: { action: 'fire_webhooks', event_type: evtMap[status], created_by_user_id: lic?.created_by || user?.id, initiator_user_id: user?.id, license_data: { license_key: lic?.license_key, owner: lic?.owner_name, status } } });
      }
      toast({ title: "Status atualizado" });
      fetchData();
    } catch { toast({ title: "Erro", variant: "destructive" }); }
  };

  const startEditLicense = (l: License) => {
    setEditingLicense(l.id);
    setEditLicIp(l.ip_address || "");
    setEditLicPort(l.port?.toString() || "");
    setEditLicExpiry(l.expires_at ? new Date(l.expires_at).toISOString().slice(0, 16) : "");
  };

  const saveEditLicense = async (id: string) => {
    try {
      const lic = licenses.find(l => l.id === id);
      const { error } = await supabase.from('licenses').update({
        ip_address: editLicIp || null,
        port: editLicPort ? parseInt(editLicPort) : null,
        expires_at: editLicExpiry || null,
      }).eq('id', id);
      if (error) throw error;
      await supabase.functions.invoke('admin-auth', { body: { action: 'audit', user_id: user?.id, audit_username: user?.username, audit_action: 'EDIT_LICENSE', details: `${id} IP=${editLicIp || '—'} Port=${editLicPort || '—'}` } });
      await supabase.functions.invoke('admin-auth', { body: { action: 'fire_webhooks', event_type: 'license_edited', created_by_user_id: lic?.created_by || user?.id, initiator_user_id: user?.id, license_data: { license_key: lic?.license_key, owner: lic?.owner_name, ip: editLicIp, port: editLicPort, expires_at: editLicExpiry } } });
      toast({ title: "Licença atualizada" });
      setEditingLicense(null);
      fetchData();
    } catch { toast({ title: "Erro", variant: "destructive" }); }
  };

  const resetIp = async (id: string) => {
    try {
      await supabase.from('licenses').update({ ip_address: null, port: null }).eq('id', id);
      toast({ title: "IP resetado" });
      fetchData();
    } catch { toast({ title: "Erro", variant: "destructive" }); }
  };

  const delLicense = async (id: string) => {
    try {
      const lic = licenses.find(l => l.id === id);
      await supabase.from('licenses').delete().eq('id', id);
      await supabase.functions.invoke('admin-auth', { body: { action: 'audit', user_id: user?.id, audit_username: user?.username, audit_action: 'DELETE_LICENSE', details: `${id}` } });
      await supabase.functions.invoke('admin-auth', { body: { action: 'fire_webhooks', event_type: 'license_deleted', created_by_user_id: lic?.created_by || user?.id, initiator_user_id: user?.id, license_data: { license_key: lic?.license_key, owner: lic?.owner_name } } });
      toast({ title: "Licença excluída" });
      setDeleteConfirmId(null);
      setDeleteConfirmText("");
      fetchData();
    } catch { toast({ title: "Erro", variant: "destructive" }); }
  };

  const updateRole = async (tid: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', { body: { action: 'update_user_role', target_user_id: tid, new_role: editRole, new_plan: editPlan, admin_user_id: user?.id, admin_username: user?.username } });
      if (error || !data?.success) throw new Error();
      toast({ title: "Cargo atualizado" }); setEditingUser(null); fetchData();
    } catch { toast({ title: "Erro", variant: "destructive" }); }
  };

  const exportCSV = () => {
    const headers = ['Chave', 'Proprietário', 'Script', 'IP', 'Porta', 'Status', 'Expiração', 'Criado em', 'Validações'];
    const rows = filtered.map(l => [l.license_key, l.owner_name, l.resource_name, l.ip_address || '', l.port || '', l.status, l.expires_at || '', l.created_at, l.validation_count]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'licenses.csv'; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exportado" });
  };

  /* ─── Webhooks ─── */
  const saveWh = async () => {
    if (!newWebhookUrl || !newWebhookEvent) { toast({ title: "Preencha todos os campos", variant: "destructive" }); return; }
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', { body: { action: 'save_webhook', user_id: user?.id, webhook_url: newWebhookUrl, event_type: newWebhookEvent, enabled: true } });
      if (error || !data?.success) throw new Error();
      toast({ title: "Webhook adicionado" }); setNewWebhookUrl(""); setNewWebhookEvent(""); fetchData();
    } catch { toast({ title: "Erro", variant: "destructive" }); }
  };

  const toggleWh = async (wh: WebhookConfig) => {
    await supabase.functions.invoke('admin-auth', { body: { action: 'save_webhook', user_id: user?.id, webhook_url: wh.webhook_url, event_type: wh.event_type, enabled: !wh.enabled, webhook_id: wh.id } });
    fetchData();
  };

  const delWh = async (id: string) => {
    await supabase.functions.invoke('admin-auth', { body: { action: 'delete_webhook', webhook_id: id, user_id: user?.id } });
    toast({ title: "Webhook removido" }); fetchData();
  };

  /* ─── Bots ─── */
  const addBot = async () => {
    if (!newBotName || !newBotToken) { toast({ title: "Nome e token obrigatórios", variant: "destructive" }); return; }
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'save_bot', user_id: user?.id, bot_name: newBotName, bot_token: newBotToken, log_channel_id: newBotLogChannel || null, ticket_category_id: newBotTicketCat || null }
      });
      if (error || !data?.success) throw new Error(data?.error || 'Erro');
      toast({ title: "Bot cadastrado" });
      setIsAddBotOpen(false);
      setNewBotName(""); setNewBotToken(""); setNewBotLogChannel(""); setNewBotTicketCat("");
      fetchData();
    } catch (e: any) { toast({ title: e.message || "Erro", variant: "destructive" }); }
  };

  const botAction = async (botId: string, action: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'bot_action', bot_id: botId, bot_action: action, user_id: user?.id, user_role: user?.role }
      });
      if (error || !data?.success) throw new Error(data?.error || 'Erro');
      toast({ title: `Bot ${action === 'start' ? 'ligado' : action === 'stop' ? 'desligado' : action === 'restart' ? 'reiniciado' : 'excluído'}` });
      fetchData();
    } catch (e: any) { toast({ title: e.message || "Erro", variant: "destructive" }); }
  };

  /* ─── Announcements ─── */
  const createAnnouncement = async () => {
    if (!annTitle || !annContent) { toast({ title: "Preencha título e conteúdo", variant: "destructive" }); return; }
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'create_announcement', user_id: user?.id, user_role: user?.role, title: annTitle, content: annContent, is_pinned: annPinned, author_name: user?.username }
      });
      if (error || !data?.success) throw new Error();
      toast({ title: "Anúncio publicado" });
      setIsAnnouncementOpen(false); setAnnTitle(""); setAnnContent(""); setAnnPinned(false);
      fetchData();
    } catch { toast({ title: "Erro", variant: "destructive" }); }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      await supabase.functions.invoke('admin-auth', { body: { action: 'delete_announcement', announcement_id: id, user_role: user?.role } });
      toast({ title: "Anúncio removido" }); fetchData();
    } catch { toast({ title: "Erro", variant: "destructive" }); }
  };

  /* ─── Tickets ─── */
  const createTicket = async () => {
    if (!ticketSubject) { toast({ title: "Assunto obrigatório", variant: "destructive" }); return; }
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'create_ticket', user_id: user?.id, user_name: user?.username, subject: ticketSubject, priority: ticketPriority }
      });
      if (error || !data?.success) throw new Error();
      toast({ title: "Ticket criado" });
      setIsTicketOpen(false); setTicketSubject(""); setTicketPriority("normal");
      fetchData();
    } catch { toast({ title: "Erro", variant: "destructive" }); }
  };

  const openTicketChat = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setTicketChatOpen(true);
    try {
      const { data } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'get_ticket_messages', ticket_id: ticket.id }
      });
      setTicketMessages(data?.messages || []);
    } catch { setTicketMessages([]); }
  };

  const sendTicketMsg = async () => {
    if (!ticketMessage.trim() || !selectedTicket) return;
    try {
      await supabase.functions.invoke('admin-auth', {
        body: {
          action: 'send_ticket_message', ticket_id: selectedTicket.id,
          sender_id: user?.id, sender_name: user?.username,
          sender_role: user?.role, message: ticketMessage.trim()
        }
      });
      setTicketMessage("");
    } catch { toast({ title: "Erro ao enviar mensagem", variant: "destructive" }); }
  };

  const closeTicket = async (ticketId: string) => {
    try {
      await supabase.functions.invoke('admin-auth', {
        body: { action: 'update_ticket', ticket_id: ticketId, status: 'closed', user_role: user?.role }
      });
      toast({ title: "Ticket fechado" });
      setTicketChatOpen(false); setSelectedTicket(null);
      fetchData();
    } catch { toast({ title: "Erro", variant: "destructive" }); }
  };

  /* ─── Filters ─── */
  const filtered = useMemo(() => licenses.filter(l => {
    const s = !searchTerm || l.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) || l.license_key.toLowerCase().includes(searchTerm.toLowerCase()) || l.resource_name.toLowerCase().includes(searchTerm.toLowerCase()) || l.ip_address?.toLowerCase().includes(searchTerm.toLowerCase());
    const st = statusFilter === 'all' || l.status === statusFilter;
    return s && st;
  }), [licenses, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(licPage * PAGE_SIZE, (licPage + 1) * PAGE_SIZE);

  const filteredValidation = useMemo(() => validationLogs.filter(l => {
    const matchText = !logFilter || l.license_key?.toLowerCase().includes(logFilter.toLowerCase()) || l.ip_address?.toLowerCase().includes(logFilter.toLowerCase());
    const matchType = logTypeFilter === 'all' || (logTypeFilter === 'success' && l.success) || (logTypeFilter === 'failed' && !l.success);
    return matchText && matchType;
  }), [validationLogs, logFilter, logTypeFilter]);

  const filteredAudit = useMemo(() => auditLogs.filter(l => {
    return !logFilter || l.username?.toLowerCase().includes(logFilter.toLowerCase()) || l.action?.toLowerCase().includes(logFilter.toLowerCase()) || l.details?.toLowerCase().includes(logFilter.toLowerCase());
  }), [auditLogs, logFilter]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-5 h-5 border-2 border-muted-foreground/20 border-t-foreground rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background text-foreground admin-bg bg-noise">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-bold tracking-tight">Athilio Auth</span>
            <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 hidden sm:inline">
              {getRoleLabel(user?.role || 'staff')} · {getPlanLabel(user?.plan || 'standard')}
            </span>
            {expiringSoon > 0 && (
              <span className="bg-destructive/20 text-destructive text-[9px] px-1.5 py-0.5 rounded-full font-medium">
                {expiringSoon} expirando
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {planLimit !== -1 && (
              <span className="text-[10px] text-muted-foreground hidden sm:inline">{usedToday}/{planLimit}</span>
            )}
            {isStaffOrAbove && (
              <Button
                variant={showAdminControls ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAdminControls(p => !p)}
                className="text-[11px] h-7 rounded-lg"
              >
                <Settings className="w-3 h-3 mr-1" />
                {showAdminControls ? 'Admin' : 'Gerenciar'}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate("/downloads")} className="text-[11px] text-muted-foreground h-7">
              <Download className="w-3 h-3 mr-1" /> <span className="hidden sm:inline">Downloads</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/docs")} className="text-[11px] text-muted-foreground h-7">
              <FileText className="w-3 h-3 mr-1" /> <span className="hidden sm:inline">Docs</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate("/"); }} className="text-muted-foreground h-7 w-7 p-0">
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* ── Pinned Announcements Banner ── */}
        {announcements.filter(a => a.is_pinned).length > 0 && (
          <div className="mb-4 space-y-2">
            {announcements.filter(a => a.is_pinned).slice(0, 3).map(ann => (
              <div key={ann.id} className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-r from-card/80 via-card/60 to-card/80 backdrop-blur-sm p-4">
                <div className="absolute inset-0 bg-gradient-to-r from-foreground/[0.02] to-transparent pointer-events-none" />
                <div className="relative flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-foreground/5 border border-border/30 flex items-center justify-center shrink-0">
                    <Pin className="w-3.5 h-3.5 text-foreground/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold tracking-tight">{ann.title}</span>
                      <span className="text-[8px] uppercase tracking-widest text-muted-foreground/60 bg-muted/50 px-1.5 py-0.5 rounded">Fixado</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed">{ann.content}</p>
                    <p className="text-[9px] text-muted-foreground/40 mt-1.5">por {ann.author_name} · {fmtShort(ann.created_at)}</p>
                  </div>
                  {isStaffOrAbove && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground/40 hover:text-destructive shrink-0 rounded-lg" onClick={() => deleteAnnouncement(ann.id)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── User Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
          {[
            { label: 'Total', value: stats.total, icon: Key },
            { label: 'Ativas', value: stats.active, icon: CheckCircle },
            { label: 'Suspensas', value: stats.suspended, icon: AlertCircle },
            { label: 'Validações Hoje', value: validationsToday, icon: Activity },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="flex items-center gap-1.5">
                <s.icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="stat-label">{s.label}</span>
              </div>
              <span className="stat-value">{s.value}</span>
            </div>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto mb-4">
            <TabsList className="bg-card/60 border border-border/40 h-9 rounded-lg p-0.5 inline-flex w-auto min-w-full sm:min-w-0">
              <TabsTrigger value="licenses" className="text-[11px] h-7 rounded-md data-[state=active]:bg-foreground data-[state=active]:text-background">
                <Key className="w-3 h-3 mr-1" /> Licenças
              </TabsTrigger>
              <TabsTrigger value="announcements" className="text-[11px] h-7 rounded-md data-[state=active]:bg-foreground data-[state=active]:text-background">
                <Megaphone className="w-3 h-3 mr-1" /> Avisos
              </TabsTrigger>
              <TabsTrigger value="tickets" className="text-[11px] h-7 rounded-md data-[state=active]:bg-foreground data-[state=active]:text-background relative">
                <HeadphonesIcon className="w-3 h-3 mr-1" /> Tickets
                {tickets.filter(t => t.status !== 'closed').length > 0 && (
                  <span className="ml-1 bg-destructive text-destructive-foreground text-[8px] rounded-full w-4 h-4 flex items-center justify-center">
                    {tickets.filter(t => t.status !== 'closed').length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="bots" className="text-[11px] h-7 rounded-md data-[state=active]:bg-foreground data-[state=active]:text-background">
                <Bot className="w-3 h-3 mr-1" /> Bots
              </TabsTrigger>
              <TabsTrigger value="config" className="text-[11px] h-7 rounded-md data-[state=active]:bg-foreground data-[state=active]:text-background">
                <Settings className="w-3 h-3 mr-1" /> Config
              </TabsTrigger>
              {isStaffOrAbove && showAdminControls && (
                <>
                  <TabsTrigger value="overview" className="text-[11px] h-7 rounded-md data-[state=active]:bg-foreground data-[state=active]:text-background">
                    <BarChart3 className="w-3 h-3 mr-1" /> Dashboard
                  </TabsTrigger>
                  <TabsTrigger value="users" className="text-[11px] h-7 rounded-md data-[state=active]:bg-foreground data-[state=active]:text-background">
                    <Users className="w-3 h-3 mr-1" /> Usuários
                  </TabsTrigger>
                  <TabsTrigger value="logs" className="text-[11px] h-7 rounded-md data-[state=active]:bg-foreground data-[state=active]:text-background">
                    <FileText className="w-3 h-3 mr-1" /> Logs
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          {/* ══ LICENSES ══ */}
          <TabsContent value="licenses">
            {planLimit !== -1 && (
              <div className={`mb-3 p-2.5 rounded-lg border text-[11px] ${canCreate ? 'border-border/40 text-muted-foreground bg-card/40' : 'border-destructive/30 text-destructive bg-card/40'}`}>
                {canCreate ? `${planLimit - usedToday} licenças restantes hoje` : 'Limite diário atingido.'}
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input placeholder="Buscar key, IP, script..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setLicPage(0); }} className="pl-8 h-8 text-xs bg-card/60 border-border/40 rounded-lg" />
              </div>
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setLicPage(0); }}>
                <SelectTrigger className="w-28 h-8 text-xs bg-card/60 border-border/40 rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="suspended">Suspensas</SelectItem>
                  <SelectItem value="revoked">Revogadas</SelectItem>
                  <SelectItem value="expired">Expiradas</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={exportCSV} className="h-8 border-border/40 text-[11px]"><Download className="w-3 h-3 mr-1" /> CSV</Button>
              <Button variant="outline" size="sm" onClick={fetchData} className="h-8 border-border/40"><RefreshCw className="w-3 h-3" /></Button>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={!canCreate} className="h-8 bg-foreground text-background hover:bg-foreground/90 text-[11px] rounded-lg">
                    <Plus className="w-3 h-3 mr-1" /> Nova Licença
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border max-w-md rounded-xl">
                  <DialogHeader><DialogTitle className="text-sm">Criar Licença</DialogTitle></DialogHeader>
                  <div className="space-y-2.5 mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] text-muted-foreground">Proprietário *</label><Input value={newLic.owner_name} onChange={e => setNewLic({ ...newLic, owner_name: e.target.value })} className="mt-1 h-8 text-xs bg-background border-border rounded-lg" /></div>
                      <div><label className="text-[10px] text-muted-foreground">Email</label><Input value={newLic.owner_email} onChange={e => setNewLic({ ...newLic, owner_email: e.target.value })} className="mt-1 h-8 text-xs bg-background border-border rounded-lg" /></div>
                    </div>
                    <div><label className="text-[10px] text-muted-foreground">Script (resource) *</label><Input value={newLic.resource_name} onChange={e => setNewLic({ ...newLic, resource_name: e.target.value })} className="mt-1 h-8 text-xs bg-background border-border rounded-lg" /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] text-muted-foreground">IP</label><Input value={newLic.ip_address} onChange={e => setNewLic({ ...newLic, ip_address: e.target.value })} placeholder="1.2.3.4" className="mt-1 h-8 text-xs bg-background border-border rounded-lg" /></div>
                      <div><label className="text-[10px] text-muted-foreground">Porta</label><Input type="number" value={newLic.port} onChange={e => setNewLic({ ...newLic, port: e.target.value })} placeholder="30120" className="mt-1 h-8 text-xs bg-background border-border rounded-lg" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] text-muted-foreground">Status</label>
                        <Select value={newLic.status} onValueChange={v => setNewLic({ ...newLic, status: v })}>
                          <SelectTrigger className="mt-1 h-8 text-xs bg-background border-border rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="active">Ativa</SelectItem><SelectItem value="suspended">Suspensa</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div><label className="text-[10px] text-muted-foreground">Expiração</label><Input type="datetime-local" value={newLic.expires_at} onChange={e => setNewLic({ ...newLic, expires_at: e.target.value })} className="mt-1 h-8 text-xs bg-background border-border rounded-lg" /></div>
                    </div>
                    <div><label className="text-[10px] text-muted-foreground">Notas internas</label><Textarea value={newLic.notes} onChange={e => setNewLic({ ...newLic, notes: e.target.value })} placeholder="Observações..." className="mt-1 text-xs bg-background border-border rounded-lg min-h-[60px]" /></div>
                    <Button className="w-full h-8 bg-foreground text-background hover:bg-foreground/90 text-[11px] rounded-lg" onClick={createLicense} disabled={!canCreate}>Gerar Licença</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
              {isLoading ? <TableSkeleton /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-card/80 border-b border-border/40">
                        <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Chave</th>
                        <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Proprietário</th>
                        <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase hidden md:table-cell">Script</th>
                        <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">IP:Porta</th>
                        <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Status</th>
                        <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase hidden lg:table-cell">Último Acesso</th>
                        <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase hidden lg:table-cell">Validações</th>
                        <th className="text-right px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.length === 0 ? (
                        <tr><td colSpan={8} className="text-center py-12">
                          <Key className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                          <p className="text-[11px] text-muted-foreground">Nenhuma licença encontrada</p>
                        </td></tr>
                      ) : paged.map(l => (
                        <tr key={l.id} className="border-b border-border/20 hover:bg-card/40 transition-colors">
                          <td className="px-3 py-2">
                            <button onClick={() => copy(l.license_key)} className="flex items-center gap-1 group">
                              <code className="font-mono text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">{l.license_key.slice(0, 14)}…</code>
                              {copiedKey === l.license_key ? <Check className="w-3 h-3 text-foreground" /> : <Copy className="w-3 h-3 text-muted-foreground/40 group-hover:text-foreground transition-colors" />}
                            </button>
                          </td>
                          <td className="px-3 py-2 font-medium">{l.owner_name}</td>
                          <td className="px-3 py-2 text-muted-foreground hidden md:table-cell">{l.resource_name}</td>
                          <td className="px-3 py-2">
                            {editingLicense === l.id ? (
                              <div className="flex gap-1">
                                <Input value={editLicIp} onChange={e => setEditLicIp(e.target.value)} placeholder="IP" className="h-6 w-20 text-[10px] bg-background border-border rounded" />
                                <Input value={editLicPort} onChange={e => setEditLicPort(e.target.value)} placeholder="Porta" className="h-6 w-14 text-[10px] bg-background border-border rounded" />
                              </div>
                            ) : (
                              <span className="font-mono text-muted-foreground text-[11px]">{l.ip_address || '—'}{l.port ? `:${l.port}` : ''}</span>
                            )}
                          </td>
                          <td className="px-3 py-2"><span className="flex items-center gap-1.5">{statusDot(l.status)}<span className="text-[11px]">{statusLabel(l.status)}</span></span></td>
                          <td className="px-3 py-2 hidden lg:table-cell text-muted-foreground text-[11px]">{fmtShort(l.last_validated)}</td>
                          <td className="px-3 py-2 hidden lg:table-cell">
                            <span className="bg-secondary text-[10px] px-1.5 py-0.5 rounded font-medium">{l.validation_count || 0}</span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            {editingLicense === l.id ? (
                              <div className="flex items-center justify-end gap-1">
                                <Input type="datetime-local" value={editLicExpiry} onChange={e => setEditLicExpiry(e.target.value)} className="h-6 w-36 text-[10px] bg-background border-border rounded" />
                                <Button size="sm" className="h-6 text-[10px] bg-foreground text-background rounded" onClick={() => saveEditLicense(l.id)}><Save className="w-3 h-3" /></Button>
                                <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setEditingLicense(null)}><X className="w-3 h-3" /></Button>
                              </div>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-card border-border text-xs rounded-lg min-w-[160px]">
                                  <DropdownMenuItem onClick={() => copy(l.license_key)}><Copy className="w-3 h-3 mr-2" /> Copiar Chave</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => startEditLicense(l)}><Edit className="w-3 h-3 mr-2" /> Editar</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => resetIp(l.id)}><RotateCcw className="w-3 h-3 mr-2" /> Reset IP</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {l.status !== 'active' && <DropdownMenuItem onClick={() => setStatus(l.id, 'active')}><CheckCircle className="w-3 h-3 mr-2" /> Ativar</DropdownMenuItem>}
                                  {l.status !== 'suspended' && <DropdownMenuItem onClick={() => setStatus(l.id, 'suspended')}><AlertCircle className="w-3 h-3 mr-2" /> Suspender</DropdownMenuItem>}
                                  {l.status !== 'revoked' && <DropdownMenuItem onClick={() => setStatus(l.id, 'revoked')}><XCircle className="w-3 h-3 mr-2" /> Revogar</DropdownMenuItem>}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => setDeleteConfirmId(l.id)} className="text-destructive"><Trash2 className="w-3 h-3 mr-2" /> Excluir</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-3 py-2 border-t border-border/30">
                  <span className="text-[10px] text-muted-foreground">{filtered.length} resultado(s) · Página {licPage + 1}/{totalPages}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled={licPage === 0} onClick={() => setLicPage(p => p - 1)}><ChevronLeft className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled={licPage >= totalPages - 1} onClick={() => setLicPage(p => p + 1)}><ChevronRight className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ══ ANNOUNCEMENTS ══ */}
          <TabsContent value="announcements">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold tracking-tight">Avisos do Sistema</h2>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  {isStaffOrAbove ? 'Publique avisos para todos os usuários.' : 'Acompanhe os avisos da equipe.'}
                </p>
              </div>
              {isStaffOrAbove && (
                <Dialog open={isAnnouncementOpen} onOpenChange={setIsAnnouncementOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-9 bg-foreground text-background hover:bg-foreground/90 text-[11px] rounded-lg gap-1.5 px-4">
                      <Megaphone className="w-3.5 h-3.5" /> Novo Aviso
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border/60 max-w-lg rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-base font-bold flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-foreground/5 border border-border/30 flex items-center justify-center">
                          <Megaphone className="w-4 h-4" />
                        </div>
                        Criar Anúncio
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 mt-3">
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Título *</label>
                        <Input value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="Ex: Manutenção programada..." className="mt-1.5 h-9 text-xs bg-background/80 border-border/40 rounded-lg" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Conteúdo *</label>
                        <Textarea value={annContent} onChange={e => setAnnContent(e.target.value)} placeholder="Descreva o aviso em detalhes..." className="mt-1.5 text-xs bg-background/80 border-border/40 rounded-lg min-h-[100px] resize-none" />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30">
                        <div className="flex items-center gap-2">
                          <Pin className="w-3.5 h-3.5 text-muted-foreground" />
                          <div>
                            <span className="text-[11px] font-medium">Fixar no topo</span>
                            <p className="text-[9px] text-muted-foreground/60">Exibido como banner em todas as páginas</p>
                          </div>
                        </div>
                        <Switch checked={annPinned} onCheckedChange={setAnnPinned} />
                      </div>
                      <Button className="w-full h-9 bg-foreground text-background hover:bg-foreground/90 text-[11px] rounded-lg font-medium" onClick={createAnnouncement}>
                        <Megaphone className="w-3.5 h-3.5 mr-1.5" /> Publicar Aviso
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {announcements.length === 0 ? (
              <div className="glass-card p-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted/30 border border-border/20 flex items-center justify-center mx-auto mb-4">
                  <Megaphone className="w-6 h-6 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium text-muted-foreground/60">Nenhum aviso publicado</p>
                <p className="text-[11px] text-muted-foreground/40 mt-1">
                  {isStaffOrAbove ? 'Clique em "Novo Aviso" para criar o primeiro.' : 'Quando houver novidades, elas aparecerão aqui.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann, idx) => (
                  <div key={ann.id} className={`relative overflow-hidden rounded-xl border transition-all hover:border-border/60 ${ann.is_pinned ? 'border-foreground/10 bg-gradient-to-br from-card/90 via-card/70 to-card/90' : 'border-border/30 bg-card/50'}`}>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${ann.is_pinned ? 'bg-foreground/[0.06] border border-foreground/10' : 'bg-muted/40 border border-border/20'}`}>
                            {ann.is_pinned ? <Pin className="w-4 h-4 text-foreground/50" /> : <Megaphone className="w-4 h-4 text-muted-foreground/40" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <span className="text-sm font-bold tracking-tight">{ann.title}</span>
                              {ann.is_pinned && (
                                <span className="text-[8px] uppercase tracking-widest text-foreground/50 bg-foreground/[0.06] border border-foreground/10 px-1.5 py-0.5 rounded-md font-semibold">Fixado</span>
                              )}
                            </div>
                            <p className="text-[12px] text-muted-foreground/70 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                            <div className="flex items-center gap-2 mt-3">
                              <div className="w-5 h-5 rounded-full bg-foreground/5 border border-border/30 flex items-center justify-center">
                                <span className="text-[8px] font-bold text-muted-foreground">{(ann.author_name || 'S')[0].toUpperCase()}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground/50">{ann.author_name} · {fmtShort(ann.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        {isStaffOrAbove && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground/30 hover:text-destructive rounded-lg shrink-0" onClick={() => deleteAnnouncement(ann.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ══ TICKETS ══ */}
          <TabsContent value="tickets">
            {!ticketChatOpen ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] text-muted-foreground">Atendimento via ticket em tempo real.</p>
                  <Dialog open={isTicketOpen} onOpenChange={setIsTicketOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-8 bg-foreground text-background hover:bg-foreground/90 text-[11px] rounded-lg">
                        <Plus className="w-3 h-3 mr-1" /> Novo Ticket
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border max-w-md rounded-xl">
                      <DialogHeader><DialogTitle className="text-sm">Abrir Ticket</DialogTitle></DialogHeader>
                      <div className="space-y-2.5 mt-2">
                        <div><label className="text-[10px] text-muted-foreground">Assunto *</label><Input value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} className="mt-1 h-8 text-xs bg-background border-border rounded-lg" placeholder="Descreva seu problema..." /></div>
                        <div><label className="text-[10px] text-muted-foreground">Prioridade</label>
                          <Select value={ticketPriority} onValueChange={setTicketPriority}>
                            <SelectTrigger className="mt-1 h-8 text-xs bg-background border-border rounded-lg"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Baixa</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="high">Alta</SelectItem>
                              <SelectItem value="urgent">Urgente</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button className="w-full h-8 bg-foreground text-background hover:bg-foreground/90 text-[11px] rounded-lg" onClick={createTicket}>Criar Ticket</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {tickets.length === 0 ? (
                  <div className="glass-card p-10 text-center">
                    <HeadphonesIcon className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-[11px] text-muted-foreground">Nenhum ticket aberto.</p>
                  </div>
                ) : (
                  <div className="glass-card overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-card/80 border-b border-border/40">
                          <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Status</th>
                          <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Assunto</th>
                          <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase hidden md:table-cell">Usuário</th>
                          <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase hidden md:table-cell">Prioridade</th>
                          <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase hidden lg:table-cell">Data</th>
                          <th className="text-right px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.map(t => (
                          <tr key={t.id} className="border-b border-border/20 hover:bg-card/40 transition-colors cursor-pointer" onClick={() => openTicketChat(t)}>
                            <td className="px-3 py-2"><span className="flex items-center gap-1.5">{statusDot(t.status)}<span className="text-[11px]">{statusLabel(t.status)}</span></span></td>
                            <td className="px-3 py-2 font-medium">{t.subject}</td>
                            <td className="px-3 py-2 text-muted-foreground hidden md:table-cell">{t.user_name}</td>
                            <td className="px-3 py-2 hidden md:table-cell">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.priority === 'urgent' ? 'bg-destructive/20 text-destructive' : t.priority === 'high' ? 'bg-destructive/10 text-destructive/80' : 'bg-secondary text-muted-foreground'}`}>
                                {priorityLabel(t.priority)}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell text-[11px]">{fmtShort(t.created_at)}</td>
                            <td className="px-3 py-2 text-right">
                              <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={(e) => { e.stopPropagation(); openTicketChat(t); }}>
                                <MessageSquare className="w-3 h-3 mr-1" /> Abrir
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              /* ── Ticket Chat ── */
              <div className="glass-card overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 300px)', minHeight: '400px' }}>
                <div className="p-3 border-b border-border/30 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setTicketChatOpen(false); setSelectedTicket(null); }}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div>
                      <span className="text-xs font-semibold">{selectedTicket?.subject}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {statusDot(selectedTicket?.status || 'open')}
                        <span className="text-[10px] text-muted-foreground">{selectedTicket?.user_name} · {fmtShort(selectedTicket?.created_at || null)}</span>
                      </div>
                    </div>
                  </div>
                  {selectedTicket?.status !== 'closed' && (
                    <Button variant="outline" size="sm" className="h-7 text-[10px] border-border/40" onClick={() => closeTicket(selectedTicket!.id)}>
                      <XCircle className="w-3 h-3 mr-1" /> Fechar
                    </Button>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {ticketMessages.length === 0 && (
                    <p className="text-center text-[11px] text-muted-foreground py-8">Nenhuma mensagem ainda. Inicie a conversa.</p>
                  )}
                  {ticketMessages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-3 py-2 rounded-lg ${msg.sender_id === user?.id ? 'bg-foreground text-background' : 'bg-secondary'}`}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-medium">{msg.sender_name}</span>
                          {msg.sender_role !== 'staff' && msg.sender_role !== 'client' && (
                            <span className="text-[8px] bg-background/20 px-1 rounded">{msg.sender_role}</span>
                          )}
                        </div>
                        <p className="text-[11px]">{msg.message}</p>
                        <p className={`text-[9px] mt-1 ${msg.sender_id === user?.id ? 'text-background/50' : 'text-muted-foreground/50'}`}>{fmtShort(msg.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                {selectedTicket?.status !== 'closed' && (
                  <div className="p-3 border-t border-border/30 flex gap-2 shrink-0">
                    <Input
                      value={ticketMessage}
                      onChange={e => setTicketMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendTicketMsg()}
                      placeholder="Digite sua mensagem..."
                      className="h-8 text-xs bg-background border-border/40 rounded-lg flex-1"
                    />
                    <Button size="sm" className="h-8 bg-foreground text-background hover:bg-foreground/90 rounded-lg" onClick={sendTicketMsg}>
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ══ BOTS ══ */}
          <TabsContent value="bots">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] text-muted-foreground">Configure bots Discord para automação.</p>
              <Dialog open={isAddBotOpen} onOpenChange={setIsAddBotOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 bg-foreground text-background hover:bg-foreground/90 text-[11px] rounded-lg">
                    <Plus className="w-3 h-3 mr-1" /> Novo Bot
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border max-w-md rounded-xl">
                  <DialogHeader><DialogTitle className="text-sm">Cadastrar Bot Discord</DialogTitle></DialogHeader>
                  <div className="space-y-2.5 mt-2">
                    <div><label className="text-[10px] text-muted-foreground">Nome do Bot *</label><Input value={newBotName} onChange={e => setNewBotName(e.target.value)} placeholder="Meu Bot" className="mt-1 h-8 text-xs bg-background border-border rounded-lg" /></div>
                    <div><label className="text-[10px] text-muted-foreground">Token do Bot *</label><Input type="password" value={newBotToken} onChange={e => setNewBotToken(e.target.value)} placeholder="Token secreto" className="mt-1 h-8 text-xs bg-background border-border rounded-lg" /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] text-muted-foreground">Canal de Logs (ID)</label><Input value={newBotLogChannel} onChange={e => setNewBotLogChannel(e.target.value)} placeholder="123456789" className="mt-1 h-8 text-xs bg-background border-border rounded-lg" /></div>
                      <div><label className="text-[10px] text-muted-foreground">Categoria Tickets (ID)</label><Input value={newBotTicketCat} onChange={e => setNewBotTicketCat(e.target.value)} placeholder="123456789" className="mt-1 h-8 text-xs bg-background border-border rounded-lg" /></div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">O token será criptografado e nunca exposto.</p>
                    <Button className="w-full h-8 bg-foreground text-background hover:bg-foreground/90 text-[11px] rounded-lg" onClick={addBot}>Cadastrar Bot</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {bots.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <Bot className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-[11px] text-muted-foreground">Nenhum bot cadastrado.</p>
              </div>
            ) : (
              <div className="grid gap-2.5">
                {bots.map(bot => (
                  <div key={bot.id} className="glass-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bot.is_running ? 'bg-[hsl(142,72%,42%)]/10' : 'bg-secondary'}`}>
                          <Bot className={`w-4 h-4 ${bot.is_running ? 'text-[hsl(142,72%,42%)]' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{bot.bot_name}</span>
                            <span className={`dot ${bot.is_running ? 'dot-active' : 'dot-offline'}`} />
                            <span className="text-[10px] text-muted-foreground">{bot.is_running ? 'Online' : 'Offline'}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                            {bot.log_channel_id && <span className="flex items-center gap-0.5"><Hash className="w-3 h-3" /> {bot.log_channel_id}</span>}
                            {bot.ticket_category_id && <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3" /> Tickets: {bot.tickets_open}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!bot.is_running ? (
                          <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg border-border/40" onClick={() => botAction(bot.id, 'start')}>
                            <Power className="w-3 h-3 mr-1" /> Ligar
                          </Button>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg border-border/40" onClick={() => botAction(bot.id, 'restart')}>
                              <RotateCw className="w-3 h-3 mr-1" /> Reiniciar
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg border-border/40" onClick={() => botAction(bot.id, 'stop')}>
                              <Power className="w-3 h-3 mr-1" /> Desligar
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => botAction(bot.id, 'delete')}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ══ CONFIG ══ */}
          <TabsContent value="config">
            <div className="glass-card p-4 mb-3">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Webhook className="w-3.5 h-3.5" /> Webhooks
              </h3>
              <div className="flex flex-col md:flex-row gap-2 mb-4 p-2.5 rounded-lg bg-background/50 border border-border/30">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground">URL</label>
                  <Input value={newWebhookUrl} onChange={e => setNewWebhookUrl(e.target.value)} placeholder="https://discord.com/api/webhooks/..." className="mt-1 h-8 text-xs bg-card/60 border-border/40 rounded-lg" />
                </div>
                <div className="w-full md:w-44">
                  <label className="text-[10px] text-muted-foreground">Evento</label>
                  <Select value={newWebhookEvent} onValueChange={setNewWebhookEvent}>
                    <SelectTrigger className="mt-1 h-8 text-xs bg-card/60 border-border/40 rounded-lg"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{WEBHOOK_EVENTS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={saveWh} className="h-8 bg-foreground text-background hover:bg-foreground/90 text-[11px] rounded-lg"><Plus className="w-3 h-3 mr-1" /> Adicionar</Button>
                </div>
              </div>

              {webhooks.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-6">Nenhum webhook configurado.</p>
              ) : (
                <div className="space-y-1.5">
                  {webhooks.map(wh => (
                    <div key={wh.id} className="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-background/50 border border-border/30">
                      <span className={`dot ${wh.enabled ? 'dot-active' : 'dot-expired'}`} />
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-medium">{WEBHOOK_EVENTS.find(e => e.value === wh.event_type)?.label || wh.event_type}</span>
                        <p className="text-[10px] font-mono text-muted-foreground truncate">{wh.webhook_url}</p>
                      </div>
                      <Switch checked={wh.enabled} onCheckedChange={() => toggleWh(wh)} />
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => delWh(wh.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card p-4">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2.5">Sua Conta</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                <div><p className="text-[10px] text-muted-foreground">Usuário</p><p className="font-medium">{user?.username}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Cargo</p><p className="font-medium">{getRoleLabel(user?.role || 'staff')}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Plano</p><p className="font-medium">{getPlanLabel(user?.plan || 'standard')}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Limite Diário</p><p className="font-medium">{planLimit === -1 ? '∞' : planLimit}</p></div>
              </div>
            </div>
          </TabsContent>

          {/* ══ ADMIN DASHBOARD ══ */}
          {isStaffOrAbove && showAdminControls && (
            <TabsContent value="overview">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
                {[
                  { label: 'Total', value: stats.total, icon: Key },
                  { label: 'Ativas', value: stats.active, icon: CheckCircle },
                  { label: 'Expiradas', value: stats.expired, icon: Clock },
                  { label: 'Validações', value: stats.validations, icon: Activity },
                  { label: 'Suspensas', value: stats.suspended, icon: AlertCircle },
                  { label: 'Revogadas', value: stats.revoked, icon: XCircle },
                  { label: 'Usuários', value: stats.users, icon: Users },
                  { label: 'Logins Falhos', value: stats.failedLogins, icon: Bell },
                ].map(s => (
                  <div key={s.label} className="stat-card">
                    <div className="flex items-center gap-1.5"><s.icon className="w-3.5 h-3.5 text-muted-foreground" /><span className="stat-label">{s.label}</span></div>
                    <span className="stat-value">{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                <div className="glass-card p-4 md:col-span-2 lg:col-span-2">
                  <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Validações (30 dias)</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={validationsByDay}>
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(0,0%,45%)' }} />
                      <YAxis tick={{ fontSize: 9, fill: 'hsl(0,0%,45%)' }} />
                      <ReTooltip contentStyle={{ background: 'hsl(0,0%,7%)', border: '1px solid hsl(0,0%,14%)', borderRadius: '8px', fontSize: '11px' }} />
                      <Line type="monotone" dataKey="count" stroke="hsl(0,0%,80%)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="glass-card p-4">
                  <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Por Script</h3>
                  {licensesByScript.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={licensesByScript} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name }) => name?.slice(0, 10)} labelLine={false}>
                          {licensesByScript.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <ReTooltip contentStyle={{ background: 'hsl(0,0%,7%)', border: '1px solid hsl(0,0%,14%)', borderRadius: '8px', fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p className="text-[11px] text-muted-foreground text-center py-10">—</p>}
                </div>
              </div>

              <div className="glass-card p-4 mb-4">
                <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Licenças por Mês</h3>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={licensesByMonth}>
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'hsl(0,0%,45%)' }} />
                    <YAxis tick={{ fontSize: 9, fill: 'hsl(0,0%,45%)' }} />
                    <ReTooltip contentStyle={{ background: 'hsl(0,0%,7%)', border: '1px solid hsl(0,0%,14%)', borderRadius: '8px', fontSize: '11px' }} />
                    <Bar dataKey="count" fill="hsl(0,0%,60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="glass-card p-4">
                  <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2.5">Validações Recentes</h3>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {validationLogs.slice(0, 10).map(l => (
                      <div key={l.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-background/50 text-[10px]">
                        <div className="flex items-center gap-2">
                          <span className={`dot ${l.success ? 'dot-active' : 'dot-revoked'}`} />
                          <span className="font-mono text-muted-foreground">{l.license_key?.slice(0, 12) || '—'}</span>
                        </div>
                        <span className="text-muted-foreground">{fmtShort(l.validated_at)}</span>
                      </div>
                    ))}
                    {validationLogs.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-4">—</p>}
                  </div>
                </div>
                <div className="glass-card p-4">
                  <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2.5">Auditoria Recente</h3>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {auditLogs.slice(0, 10).map(l => (
                      <div key={l.id} className="py-1.5 px-2 rounded bg-background/50 text-[10px]">
                        <div className="flex justify-between"><span className="font-medium">{l.username}</span><span className="text-muted-foreground">{fmtShort(l.created_at)}</span></div>
                        <div className="flex items-center gap-1 mt-0.5"><code className="text-[9px] bg-muted px-1 rounded">{l.action}</code><span className="text-muted-foreground truncate">{l.details}</span></div>
                      </div>
                    ))}
                    {auditLogs.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-4">—</p>}
                  </div>
                </div>
              </div>
            </TabsContent>
          )}

          {/* ══ USERS (Admin) ══ */}
          {isStaffOrAbove && showAdminControls && (
            <TabsContent value="users">
              <div className="glass-card overflow-hidden">
                {isLoading ? <TableSkeleton /> : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-card/80 border-b border-border/40">
                        <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Usuário</th>
                        <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase hidden md:table-cell">Email</th>
                        <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Cargo</th>
                        <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Plano</th>
                        <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase hidden lg:table-cell">Último Login</th>
                        <th className="text-right px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffUsers.map(s => (
                        <tr key={s.id} className="border-b border-border/20 hover:bg-card/40 transition-colors">
                          <td className="px-3 py-2 font-medium">{s.username}</td>
                          <td className="px-3 py-2 text-muted-foreground hidden md:table-cell">{s.email}</td>
                          <td className="px-3 py-2">
                            {editingUser === s.id ? (
                              <Select value={editRole} onValueChange={setEditRole}>
                                <SelectTrigger className="h-6 text-[10px] w-24 bg-background border-border rounded"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="staff">Staff</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="master">Master</SelectItem><SelectItem value="master_plus">Master++</SelectItem></SelectContent>
                              </Select>
                            ) : <span className="text-muted-foreground">{getRoleLabel(s.role)}</span>}
                          </td>
                          <td className="px-3 py-2">
                            {editingUser === s.id ? (
                              <Select value={editPlan} onValueChange={setEditPlan}>
                                <SelectTrigger className="h-6 text-[10px] w-24 bg-background border-border rounded"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="standard">Padrão</SelectItem><SelectItem value="master">Master</SelectItem><SelectItem value="master_plus">Master++</SelectItem></SelectContent>
                              </Select>
                            ) : <span className="text-muted-foreground">{getPlanLabel(s.plan)}</span>}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell">{fmtShort(s.last_login)}</td>
                          <td className="px-3 py-2 text-right">
                            {user?.role === 'master_plus' && s.id !== user?.id && (
                              editingUser === s.id ? (
                                <div className="flex items-center justify-end gap-1">
                                  <Button size="sm" className="h-6 text-[10px] bg-foreground text-background rounded" onClick={() => updateRole(s.id)}><Save className="w-3 h-3" /></Button>
                                  <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setEditingUser(null)}><X className="w-3 h-3" /></Button>
                                </div>
                              ) : (
                                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground hover:text-foreground" onClick={() => { setEditingUser(s.id); setEditRole(s.role); setEditPlan(s.plan); }}>
                                  <Edit className="w-3 h-3 mr-1" /> Editar
                                </Button>
                              )
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </TabsContent>
          )}

          {/* ══ LOGS (Admin) ══ */}
          {isStaffOrAbove && showAdminControls && (
            <TabsContent value="logs">
              <div className="flex flex-col md:flex-row gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input placeholder="Filtrar..." value={logFilter} onChange={e => setLogFilter(e.target.value)} className="pl-8 h-8 text-xs bg-card/60 border-border/40 rounded-lg" />
                </div>
                <Select value={logTypeFilter} onValueChange={setLogTypeFilter}>
                  <SelectTrigger className="w-28 h-8 text-xs bg-card/60 border-border/40 rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="success">Sucesso</SelectItem>
                    <SelectItem value="failed">Falha</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Tabs defaultValue="validation" className="w-full">
                <TabsList className="bg-card/60 border border-border/40 mb-2.5 h-8 rounded-lg p-0.5">
                  <TabsTrigger value="validation" className="text-[10px] h-6 rounded data-[state=active]:bg-foreground data-[state=active]:text-background">Validações</TabsTrigger>
                  <TabsTrigger value="audit" className="text-[10px] h-6 rounded data-[state=active]:bg-foreground data-[state=active]:text-background">Auditoria</TabsTrigger>
                  <TabsTrigger value="login" className="text-[10px] h-6 rounded data-[state=active]:bg-foreground data-[state=active]:text-background">Login</TabsTrigger>
                </TabsList>

                <TabsContent value="validation">
                  <div className="glass-card overflow-hidden">
                    {isLoading ? <TableSkeleton /> : (
                      <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-card">
                            <tr className="border-b border-border/40">
                              <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Status</th>
                              <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Licença</th>
                              <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">IP</th>
                              <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Erro</th>
                              <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Data</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredValidation.length === 0 ? (
                              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-[11px]">Nenhum log</td></tr>
                            ) : filteredValidation.map(l => (
                              <tr key={l.id} className="border-b border-border/20 hover:bg-card/40">
                                <td className="px-3 py-2"><span className={`dot ${l.success ? 'dot-active' : 'dot-revoked'}`} /></td>
                                <td className="px-3 py-2 font-mono text-muted-foreground">{l.license_key?.slice(0, 14) || '—'}</td>
                                <td className="px-3 py-2 text-muted-foreground">{l.ip_address || '—'}</td>
                                <td className="px-3 py-2 text-muted-foreground">{l.error_message || '—'}</td>
                                <td className="px-3 py-2 text-muted-foreground">{fmtShort(l.validated_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="audit">
                  <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-card">
                          <tr className="border-b border-border/40">
                            <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Usuário</th>
                            <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Ação</th>
                            <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Detalhes</th>
                            <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">IP</th>
                            <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAudit.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-[11px]">Nenhum log</td></tr>
                          ) : filteredAudit.map(l => (
                            <tr key={l.id} className="border-b border-border/20 hover:bg-card/40">
                              <td className="px-3 py-2 font-medium">{l.username || '—'}</td>
                              <td className="px-3 py-2"><code className="text-[9px] bg-muted px-1 rounded">{l.action}</code></td>
                              <td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate">{l.details || '—'}</td>
                              <td className="px-3 py-2 text-muted-foreground font-mono text-[10px]">{l.ip_address || '—'}</td>
                              <td className="px-3 py-2 text-muted-foreground">{fmtShort(l.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="login">
                  <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-card">
                          <tr className="border-b border-border/40">
                            <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Status</th>
                            <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Usuário</th>
                            <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">IP</th>
                            <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loginAttempts.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-8 text-muted-foreground text-[11px]">Nenhuma tentativa</td></tr>
                          ) : loginAttempts.map(l => (
                            <tr key={l.id} className="border-b border-border/20 hover:bg-card/40">
                              <td className="px-3 py-2"><span className={`dot ${l.success ? 'dot-active' : 'dot-revoked'}`} /></td>
                              <td className="px-3 py-2 font-medium">{l.username}</td>
                              <td className="px-3 py-2 text-muted-foreground font-mono text-[10px]">{l.ip_address || '—'}</td>
                              <td className="px-3 py-2 text-muted-foreground">{fmtShort(l.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => { setDeleteConfirmId(null); setDeleteConfirmText(""); }}>
        <DialogContent className="bg-card border-border max-w-sm rounded-xl">
          <DialogHeader><DialogTitle className="text-sm text-destructive">Confirmar Exclusão</DialogTitle></DialogHeader>
          <p className="text-[11px] text-muted-foreground">Digite <code className="bg-destructive/20 text-destructive px-1 rounded">DELETE</code> para confirmar.</p>
          <Input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="DELETE" className="h-8 text-xs bg-background border-border rounded-lg" />
          <Button
            className="w-full h-8 bg-destructive text-destructive-foreground hover:bg-destructive/90 text-[11px] rounded-lg"
            disabled={deleteConfirmText !== 'DELETE'}
            onClick={() => deleteConfirmId && delLicense(deleteConfirmId)}
          >
            Excluir Permanentemente
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;

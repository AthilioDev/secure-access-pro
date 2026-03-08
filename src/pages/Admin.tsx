import { useEffect, useState, useMemo } from "react";
import {
  Shield, LogOut, Plus, Key, Users, Activity,
  Trash2, Search, RefreshCw, Copy, Check,
  AlertCircle, CheckCircle, XCircle, Clock, Download,
  BarChart3, FileText, Bell, Filter, Globe, Hash,
  Settings, Webhook, Edit, Save, X,
  Lock, MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getPlanLimits, getPlanLabel, getRoleLabel } from "@/lib/auth";
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

/* ─── Types ─── */
interface License {
  id: string; license_key: string; owner_name: string; owner_email: string | null;
  resource_name: string; hwid: string | null; ip_address: string | null;
  port: number | null; status: string; expires_at: string | null;
  last_validated: string | null; validation_count: number; created_at: string; created_by: string | null;
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

const WEBHOOK_EVENTS = [
  { value: 'license_created', label: 'Criada' },
  { value: 'license_edited', label: 'Editada' },
  { value: 'license_suspended', label: 'Suspensa' },
  { value: 'license_revoked', label: 'Revogada' },
  { value: 'license_expired', label: 'Expirada' },
  { value: 'license_validated', label: 'Validada' },
  { value: 'license_deleted', label: 'Deletada' },
];

/* ─── Helpers ─── */
const statusDot = (s: string) => {
  const c: Record<string, string> = { active: 'dot-active', suspended: 'dot-suspended', revoked: 'dot-revoked', expired: 'dot-expired' };
  return <span className={`dot ${c[s] || 'dot-expired'}`} />;
};
const statusLabel = (s: string) => {
  const m: Record<string, string> = { active: 'Ativa', suspended: 'Suspensa', revoked: 'Revogada', expired: 'Expirada' };
  return m[s] || s;
};
const fmt = (d: string | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

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
  const [manageLicense, setManageLicense] = useState<License | null>(null);

  const [newLic, setNewLic] = useState({
    owner_name: "", owner_email: "", resource_name: "",
    ip_address: "", port: "", status: "active", expires_at: ""
  });

  const isAdmin = user?.role === 'master_plus' || user?.role === 'master' || user?.role === 'admin';

  useEffect(() => { if (!authLoading && !isAuthenticated) navigate("/login"); }, [isAuthenticated, authLoading, navigate]);

  const fetchData = async () => {
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
      }
    } catch {
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, showAdminControls]);

  useEffect(() => {
    if (!showAdminControls && ['overview', 'users', 'logs'].includes(activeTab)) {
      setActiveTab('licenses');
    }
  }, [showAdminControls, activeTab]);

  const copy = (k: string) => {
    navigator.clipboard.writeText(k); setCopiedKey(k);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const planLimit = user ? getPlanLimits(user.plan) : 5;
  const cu = staffUsers.find(s => s.id === user?.id);
  const isToday = cu?.last_license_date === new Date().toISOString().split('T')[0];
  const usedToday = isToday ? (cu?.daily_license_count || 0) : 0;
  const canCreate = planLimit === -1 || usedToday < planLimit;

  const createLicense = async () => {
    if (!newLic.owner_name || !newLic.resource_name) { toast({ title: "Campos obrigatórios", variant: "destructive" }); return; }
    if (!canCreate) { toast({ title: "Limite diário atingido", variant: "destructive" }); return; }
    try {
      const key = crypto.randomUUID();
      const { error } = await supabase.from('licenses').insert({
        license_key: key, owner_name: newLic.owner_name, owner_email: newLic.owner_email || null,
        resource_name: newLic.resource_name, ip_address: newLic.ip_address || null,
        port: newLic.port ? parseInt(newLic.port) : null, status: newLic.status,
        expires_at: newLic.expires_at || null, created_by: user?.id || null,
      });
      if (error) throw error;
      await supabase.functions.invoke('admin-auth', { body: { action: 'audit', user_id: user?.id, audit_username: user?.username, audit_action: 'CREATE_LICENSE', details: `${newLic.owner_name} - ${newLic.resource_name}` } });
      await supabase.functions.invoke('admin-auth', { body: { action: 'fire_webhooks', event_type: 'license_created', created_by_user_id: user?.id, initiator_user_id: user?.id, license_data: { license_key: key, owner: newLic.owner_name, resource: newLic.resource_name } } });
      toast({ title: "Licença criada" });
      setIsCreateOpen(false);
      setNewLic({ owner_name: "", owner_email: "", resource_name: "", ip_address: "", port: "", status: "active", expires_at: "" });
      fetchData();
    } catch { toast({ title: "Erro", variant: "destructive" }); }
  };

  const setStatus = async (id: string, status: string) => {
    try {
      const lic = licenses.find(l => l.id === id);
      const payload: { status: string; created_by?: string } = { status };
      if (!lic?.created_by && user?.id) payload.created_by = user.id;

      const { error } = await supabase.from('licenses').update(payload).eq('id', id);
      if (error) throw error;

      await supabase.functions.invoke('admin-auth', { body: { action: 'audit', user_id: user?.id, audit_username: user?.username, audit_action: 'UPDATE_LICENSE_STATUS', details: `${id} → ${status}` } });
      const evtMap: Record<string, string> = { suspended: 'license_suspended', revoked: 'license_revoked', active: 'license_edited' };
      if (evtMap[status]) {
        await supabase.functions.invoke('admin-auth', {
          body: {
            action: 'fire_webhooks',
            event_type: evtMap[status],
            created_by_user_id: lic?.created_by || user?.id,
            initiator_user_id: user?.id,
            license_data: { license_key: lic?.license_key, owner: lic?.owner_name, status }
          }
        });
      }

      toast({ title: "Status atualizado" });
      setManageLicense(null);
      fetchData();
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const delLicense = async (id: string) => {
    if (!confirm("Excluir esta licença?")) return;
    try {
      const lic = licenses.find(l => l.id === id);
      await supabase.from('licenses').delete().eq('id', id);
      await supabase.functions.invoke('admin-auth', { body: { action: 'audit', user_id: user?.id, audit_username: user?.username, audit_action: 'DELETE_LICENSE', details: `${id}` } });
      await supabase.functions.invoke('admin-auth', {
        body: {
          action: 'fire_webhooks',
          event_type: 'license_deleted',
          created_by_user_id: lic?.created_by || user?.id,
          initiator_user_id: user?.id,
          license_data: { license_key: lic?.license_key, owner: lic?.owner_name }
        }
      });
      toast({ title: "Licença excluída" });
      setManageLicense(null);
      fetchData();
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const updateRole = async (tid: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', { body: { action: 'update_user_role', target_user_id: tid, new_role: editRole, new_plan: editPlan, admin_user_id: user?.id, admin_username: user?.username } });
      if (error || !data?.success) throw new Error();
      toast({ title: "Cargo atualizado" }); setEditingUser(null); fetchData();
    } catch { toast({ title: "Erro", variant: "destructive" }); }
  };

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

  const filtered = useMemo(() => licenses.filter(l => {
    const s = !searchTerm || l.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) || l.license_key.toLowerCase().includes(searchTerm.toLowerCase()) || l.resource_name.toLowerCase().includes(searchTerm.toLowerCase()) || l.ip_address?.toLowerCase().includes(searchTerm.toLowerCase());
    const st = statusFilter === 'all' || l.status === statusFilter;
    return s && st;
  }), [licenses, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    total: licenses.length,
    active: licenses.filter(l => l.status === 'active').length,
    expired: licenses.filter(l => l.status === 'expired').length,
    suspended: licenses.filter(l => l.status === 'suspended').length,
    revoked: licenses.filter(l => l.status === 'revoked').length,
    validations: licenses.reduce((a, l) => a + (l.validation_count || 0), 0),
    users: staffUsers.length,
    failedLogins: loginAttempts.filter(l => !l.success).length,
  }), [licenses, loginAttempts, staffUsers]);

  const filteredValidation = useMemo(() => {
    return validationLogs.filter(l => {
      const matchText = !logFilter || l.license_key?.toLowerCase().includes(logFilter.toLowerCase()) || l.ip_address?.toLowerCase().includes(logFilter.toLowerCase());
      const matchType = logTypeFilter === 'all' || (logTypeFilter === 'success' && l.success) || (logTypeFilter === 'failed' && !l.success);
      return matchText && matchType;
    });
  }, [validationLogs, logFilter, logTypeFilter]);

  const filteredAudit = useMemo(() => {
    return auditLogs.filter(l => {
      return !logFilter || l.username?.toLowerCase().includes(logFilter.toLowerCase()) || l.action?.toLowerCase().includes(logFilter.toLowerCase()) || l.details?.toLowerCase().includes(logFilter.toLowerCase());
    });
  }, [auditLogs, logFilter]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background text-foreground admin-rustic">
      {/* Header */}
      <header className="border-b border-border bg-card/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-foreground" />
            <span className="text-sm font-semibold tracking-tight">Secure Access Pro</span>
            <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
              {getRoleLabel(user?.role || 'staff')} · {getPlanLabel(user?.plan || 'standard')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {planLimit !== -1 && (
              <span className="text-[10px] text-muted-foreground">{usedToday}/{planLimit} licenças hoje</span>
            )}
            {isAdmin && (
              <Button
                variant={showAdminControls ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAdminControls((prev) => !prev)}
                className="text-xs h-8 rounded-full"
              >
                <Settings className="w-3.5 h-3.5 mr-1" />
                {showAdminControls ? 'Fechar Gerenciar' : 'Gerenciar'}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate("/downloads")} className="text-xs text-muted-foreground h-8 rounded-full">
              <Download className="w-3.5 h-3.5 mr-1" /> Downloads
            </Button>
            <span className="text-xs text-muted-foreground hidden md:inline">{user?.username}</span>
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate("/"); }} className="text-xs text-muted-foreground h-8 rounded-full hover:text-foreground">
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-card border border-border mb-5 h-10 rounded-full p-1">
            <TabsTrigger value="licenses" className="text-xs h-7 rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background">
              <Key className="w-3 h-3 mr-1" /> Minhas Licenças
            </TabsTrigger>
            {isAdmin && showAdminControls && (
              <>
                <TabsTrigger value="overview" className="text-xs h-7 rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background">
                  <BarChart3 className="w-3 h-3 mr-1" /> Admin
                </TabsTrigger>
                <TabsTrigger value="users" className="text-xs h-7 rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background">
                  <Users className="w-3 h-3 mr-1" /> Usuários
                </TabsTrigger>
                <TabsTrigger value="logs" className="text-xs h-7 rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background">
                  <FileText className="w-3 h-3 mr-1" /> Logs
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="config" className="text-xs h-7 rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background">
              <Settings className="w-3 h-3 mr-1" /> Config
            </TabsTrigger>
          </TabsList>

          {/* ── LICENSES ── */}
          <TabsContent value="licenses">
            {planLimit !== -1 && (
              <div className={`mb-4 p-3 rounded-2xl border text-xs ${canCreate ? 'border-border text-muted-foreground bg-card/40' : 'border-destructive/30 text-destructive bg-card/40'}`}>
                {canCreate ? `${planLimit - usedToday} licenças restantes hoje (plano ${getPlanLabel(user?.plan || 'standard')})` : 'Limite diário atingido.'}
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 h-8 text-xs bg-card border-border" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-8 text-xs bg-card border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="suspended">Suspensas</SelectItem>
                  <SelectItem value="revoked">Revogadas</SelectItem>
                  <SelectItem value="expired">Expiradas</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchData} className="h-8 border-border"><RefreshCw className="w-3 h-3" /></Button>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={!canCreate} className="h-8 bg-foreground text-background hover:bg-foreground/90 text-xs">
                    <Plus className="w-3 h-3 mr-1" /> Nova Licença
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border max-w-md">
                  <DialogHeader><DialogTitle className="text-sm">Criar Licença</DialogTitle></DialogHeader>
                  <div className="space-y-3 mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] text-muted-foreground">Proprietário *</label><Input value={newLic.owner_name} onChange={e => setNewLic({ ...newLic, owner_name: e.target.value })} className="mt-1 h-8 text-xs bg-background border-border" /></div>
                      <div><label className="text-[10px] text-muted-foreground">Email</label><Input value={newLic.owner_email} onChange={e => setNewLic({ ...newLic, owner_email: e.target.value })} className="mt-1 h-8 text-xs bg-background border-border" /></div>
                    </div>
                    <div><label className="text-[10px] text-muted-foreground">Script (resource) *</label><Input value={newLic.resource_name} onChange={e => setNewLic({ ...newLic, resource_name: e.target.value })} className="mt-1 h-8 text-xs bg-background border-border" /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] text-muted-foreground">IP</label><Input value={newLic.ip_address} onChange={e => setNewLic({ ...newLic, ip_address: e.target.value })} placeholder="1.2.3.4" className="mt-1 h-8 text-xs bg-background border-border" /></div>
                      <div><label className="text-[10px] text-muted-foreground">Porta</label><Input type="number" value={newLic.port} onChange={e => setNewLic({ ...newLic, port: e.target.value })} placeholder="30120" className="mt-1 h-8 text-xs bg-background border-border" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] text-muted-foreground">Status</label>
                        <Select value={newLic.status} onValueChange={v => setNewLic({ ...newLic, status: v })}>
                          <SelectTrigger className="mt-1 h-8 text-xs bg-background border-border"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="active">Ativa</SelectItem><SelectItem value="suspended">Suspensa</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div><label className="text-[10px] text-muted-foreground">Expiração</label><Input type="datetime-local" value={newLic.expires_at} onChange={e => setNewLic({ ...newLic, expires_at: e.target.value })} className="mt-1 h-8 text-xs bg-background border-border" /></div>
                    </div>
                    <Button className="w-full h-8 bg-foreground text-background hover:bg-foreground/90 text-xs" onClick={createLicense} disabled={!canCreate}>Gerar Licença</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-border overflow-hidden bg-card/40">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-card border-b border-border">
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Chave</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Proprietário</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Script</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">IP:Porta</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Status</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Criada</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Expira</th>
                      <th className="text-right px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={8} className="text-center py-10"><div className="w-5 h-5 border-2 border-muted-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" /></td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">Nenhuma licença</td></tr>
                    ) : filtered.map(l => (
                      <tr key={l.id} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                        <td className="px-3 py-2">
                          <button onClick={() => copy(l.license_key)} className="flex items-center gap-1 group">
                            <code className="font-mono text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">{l.license_key.slice(0, 8)}…</code>
                            {copiedKey === l.license_key ? <Check className="w-3 h-3 text-foreground" /> : <Copy className="w-3 h-3 text-muted-foreground/50 group-hover:text-foreground transition-colors" />}
                          </button>
                        </td>
                        <td className="px-3 py-2"><span className="font-medium">{l.owner_name}</span></td>
                        <td className="px-3 py-2 text-muted-foreground">{l.resource_name}</td>
                        <td className="px-3 py-2 font-mono text-muted-foreground">{l.ip_address || '—'}{l.port ? `:${l.port}` : ''}</td>
                        <td className="px-3 py-2"><span className="flex items-center gap-1.5">{statusDot(l.status)}{statusLabel(l.status)}</span></td>
                        <td className="px-3 py-2 text-muted-foreground">{fmt(l.created_at)}</td>
                        <td className="px-3 py-2 text-muted-foreground">{fmt(l.expires_at)}</td>
                        <td className="px-3 py-2 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border-border text-xs">
                              <DropdownMenuItem onClick={() => copy(l.license_key)} className="text-xs"><Copy className="w-3 h-3 mr-2" /> Copiar Chave</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {l.status !== 'active' && <DropdownMenuItem onClick={() => setStatus(l.id, 'active')} className="text-xs"><CheckCircle className="w-3 h-3 mr-2" /> Ativar</DropdownMenuItem>}
                              {l.status !== 'suspended' && <DropdownMenuItem onClick={() => setStatus(l.id, 'suspended')} className="text-xs"><AlertCircle className="w-3 h-3 mr-2" /> Suspender</DropdownMenuItem>}
                              {l.status !== 'revoked' && <DropdownMenuItem onClick={() => setStatus(l.id, 'revoked')} className="text-xs"><XCircle className="w-3 h-3 mr-2" /> Revogar</DropdownMenuItem>}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => delLicense(l.id)} className="text-xs text-destructive"><Trash2 className="w-3 h-3 mr-2" /> Excluir</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* ── OVERVIEW (Admin) ── */}
          {isAdmin && showAdminControls && (
            <TabsContent value="overview">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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
                  <div key={s.label} className="bg-card/70 border border-border rounded-2xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <s.icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
                    </div>
                    <p className="text-xl font-semibold">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-card/70 border border-border rounded-2xl p-4">
                  <h3 className="text-xs font-medium mb-3 text-muted-foreground uppercase tracking-wider">Validações Recentes</h3>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {validationLogs.slice(0, 12).map(l => (
                      <div key={l.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-background text-[11px]">
                        <div className="flex items-center gap-2">
                          {l.success ? <span className="dot dot-active" /> : <span className="dot dot-revoked" />}
                          <span className="font-mono text-muted-foreground">{l.license_key?.slice(0, 12) || '—'}</span>
                        </div>
                        <span className="text-muted-foreground">{fmt(l.validated_at)}</span>
                      </div>
                    ))}
                    {validationLogs.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">—</p>}
                  </div>
                </div>
                <div className="bg-card/70 border border-border rounded-2xl p-4">
                  <h3 className="text-xs font-medium mb-3 text-muted-foreground uppercase tracking-wider">Auditoria Recente</h3>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {auditLogs.slice(0, 12).map(l => (
                      <div key={l.id} className="py-1.5 px-2 rounded bg-background text-[11px]">
                        <div className="flex justify-between"><span className="font-medium">{l.username}</span><span className="text-muted-foreground">{fmt(l.created_at)}</span></div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <code className="text-[10px] bg-muted px-1 rounded text-muted-foreground">{l.action}</code>
                          <span className="text-muted-foreground truncate">{l.details}</span>
                        </div>
                      </div>
                    ))}
                    {auditLogs.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">—</p>}
                  </div>
                </div>
              </div>
            </TabsContent>
          )}

          {/* ── USERS (Admin) ── */}
          {isAdmin && showAdminControls && (
            <TabsContent value="users">
              <div className="rounded-2xl border border-border overflow-hidden bg-card/40">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-card border-b border-border">
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Usuário</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Email</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Cargo</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Plano</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Licenças Hoje</th>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Último Login</th>
                      <th className="text-right px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffUsers.map(s => (
                      <tr key={s.id} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                        <td className="px-3 py-2 font-medium">{s.username}</td>
                        <td className="px-3 py-2 text-muted-foreground">{s.email}</td>
                        <td className="px-3 py-2">
                          {editingUser === s.id ? (
                            <Select value={editRole} onValueChange={setEditRole}>
                              <SelectTrigger className="h-7 text-[10px] w-28 bg-background border-border"><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="staff">Staff</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="master">Master</SelectItem><SelectItem value="master_plus">Master++</SelectItem></SelectContent>
                            </Select>
                          ) : <span className="text-muted-foreground">{getRoleLabel(s.role)}</span>}
                        </td>
                        <td className="px-3 py-2">
                          {editingUser === s.id ? (
                            <Select value={editPlan} onValueChange={setEditPlan}>
                              <SelectTrigger className="h-7 text-[10px] w-28 bg-background border-border"><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="standard">Padrão</SelectItem><SelectItem value="master">Master</SelectItem><SelectItem value="master_plus">Master++</SelectItem></SelectContent>
                            </Select>
                          ) : <span className="text-muted-foreground">{getPlanLabel(s.plan)}</span>}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {s.last_license_date === new Date().toISOString().split('T')[0] ? `${s.daily_license_count}/${getPlanLimits(s.plan) === -1 ? '∞' : getPlanLimits(s.plan)}` : '0'}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{fmt(s.last_login)}</td>
                        <td className="px-3 py-2 text-right">
                          {user?.role === 'master_plus' && s.id !== user?.id && (
                            editingUser === s.id ? (
                              <div className="flex items-center justify-end gap-1">
                                <Button size="sm" className="h-6 text-[10px] bg-foreground text-background" onClick={() => updateRole(s.id)}><Save className="w-3 h-3 mr-1" /> Salvar</Button>
                                <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setEditingUser(null)}><X className="w-3 h-3" /></Button>
                              </div>
                            ) : (
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground hover:text-foreground" onClick={() => { setEditingUser(s.id); setEditRole(s.role); setEditPlan(s.plan); }}>
                                <Edit className="w-3 h-3 mr-1" /> Gerenciar
                              </Button>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          )}

          {/* ── LOGS (Admin) ── */}
          {isAdmin && showAdminControls && (
            <TabsContent value="logs">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input placeholder="Filtrar por chave, IP, usuário..." value={logFilter} onChange={e => setLogFilter(e.target.value)} className="pl-8 h-8 text-xs bg-card border-border" />
                </div>
                <Select value={logTypeFilter} onValueChange={setLogTypeFilter}>
                  <SelectTrigger className="w-36 h-8 text-xs bg-card border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="success">Sucesso</SelectItem>
                    <SelectItem value="failed">Falha</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Tabs defaultValue="validation" className="w-full">
                <TabsList className="bg-card border border-border mb-3 h-8">
                  <TabsTrigger value="validation" className="text-[10px] h-6 data-[state=active]:bg-foreground data-[state=active]:text-background">Validações</TabsTrigger>
                  <TabsTrigger value="audit" className="text-[10px] h-6 data-[state=active]:bg-foreground data-[state=active]:text-background">Auditoria</TabsTrigger>
                  <TabsTrigger value="login" className="text-[10px] h-6 data-[state=active]:bg-foreground data-[state=active]:text-background">Login</TabsTrigger>
                </TabsList>

                <TabsContent value="validation">
                  <div className="rounded-md border border-border overflow-hidden">
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-card">
                          <tr className="border-b border-border">
                            <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Status</th>
                            <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Licença</th>
                            <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">IP</th>
                            <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Resultado</th>
                            <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Erro</th>
                            <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredValidation.map(l => (
                            <tr key={l.id} className="border-b border-border/30 hover:bg-card/50 transition-colors">
                              <td className="px-3 py-2"><span className={`dot ${l.success ? 'dot-active' : 'dot-revoked'}`} /></td>
                              <td className="px-3 py-2 font-mono text-muted-foreground">{l.license_key?.slice(0, 16) || '—'}</td>
                              <td className="px-3 py-2 font-mono text-muted-foreground">{l.ip_address || '—'}</td>
                              <td className="px-3 py-2">{l.result || '—'}</td>
                              <td className="px-3 py-2 text-destructive">{l.error_message || '—'}</td>
                              <td className="px-3 py-2 text-muted-foreground">{fmt(l.validated_at)}</td>
                            </tr>
                          ))}
                          {filteredValidation.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Sem resultados</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="audit">
                  <div className="rounded-md border border-border overflow-hidden">
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-card">
                          <tr className="border-b border-border">
                            <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Usuário</th>
                            <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Ação</th>
                            <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Detalhes</th>
                            <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">IP</th>
                            <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAudit.map(l => (
                            <tr key={l.id} className="border-b border-border/30 hover:bg-card/50 transition-colors">
                              <td className="px-3 py-2 font-medium">{l.username || '—'}</td>
                              <td className="px-3 py-2"><code className="text-[10px] bg-muted px-1 rounded">{l.action}</code></td>
                              <td className="px-3 py-2 text-muted-foreground max-w-xs truncate">{l.details || '—'}</td>
                              <td className="px-3 py-2 font-mono text-muted-foreground">{l.ip_address || '—'}</td>
                              <td className="px-3 py-2 text-muted-foreground">{fmt(l.created_at)}</td>
                            </tr>
                          ))}
                          {filteredAudit.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">Sem resultados</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="login">
                  <div className="rounded-md border border-border overflow-hidden">
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-card">
                          <tr className="border-b border-border">
                            <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Status</th>
                            <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Usuário</th>
                            <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">IP</th>
                            <th className="text-left px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase">Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loginAttempts.map(a => (
                            <tr key={a.id} className="border-b border-border/30 hover:bg-card/50 transition-colors">
                              <td className="px-3 py-2"><span className={`dot ${a.success ? 'dot-active' : 'dot-revoked'}`} /></td>
                              <td className="px-3 py-2 font-medium">{a.username}</td>
                              <td className="px-3 py-2 font-mono text-muted-foreground">{a.ip_address || '—'}</td>
                              <td className="px-3 py-2 text-muted-foreground">{fmt(a.created_at)}</td>
                            </tr>
                          ))}
                          {loginAttempts.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-muted-foreground">—</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>
          )}

          {/* ── CONFIG (Webhooks) ── */}
          <TabsContent value="config">
            <div className="bg-card border border-border rounded-md p-5 mb-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Webhook className="w-3.5 h-3.5" /> Webhooks
              </h3>
              <div className="flex flex-col md:flex-row gap-2 mb-5 p-3 rounded-md bg-background border border-border">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground">URL</label>
                  <Input value={newWebhookUrl} onChange={e => setNewWebhookUrl(e.target.value)} placeholder="https://discord.com/api/webhooks/..." className="mt-1 h-8 text-xs bg-card border-border" />
                </div>
                <div className="w-full md:w-44">
                  <label className="text-[10px] text-muted-foreground">Evento</label>
                  <Select value={newWebhookEvent} onValueChange={setNewWebhookEvent}>
                    <SelectTrigger className="mt-1 h-8 text-xs bg-card border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{WEBHOOK_EVENTS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={saveWh} className="h-8 bg-foreground text-background hover:bg-foreground/90 text-xs"><Plus className="w-3 h-3 mr-1" /> Adicionar</Button>
                </div>
              </div>

              {webhooks.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">Nenhum webhook configurado.</p>
              ) : (
                <div className="space-y-1.5">
                  {webhooks.map(wh => (
                    <div key={wh.id} className="flex items-center gap-3 py-2 px-3 rounded-md bg-background border border-border">
                      <span className={`dot ${wh.enabled ? 'dot-active' : 'dot-expired'}`} />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium">{WEBHOOK_EVENTS.find(e => e.value === wh.event_type)?.label || wh.event_type}</span>
                        <p className="text-[10px] font-mono text-muted-foreground truncate">{wh.webhook_url}</p>
                      </div>
                      <Switch checked={wh.enabled} onCheckedChange={() => toggleWh(wh)} />
                      <Button variant="ghost" size="sm" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => delWh(wh.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-md p-5">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Sua Conta</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div><p className="text-[10px] text-muted-foreground mb-0.5">Usuário</p><p className="font-medium">{user?.username}</p></div>
                <div><p className="text-[10px] text-muted-foreground mb-0.5">Cargo</p><p className="font-medium">{getRoleLabel(user?.role || 'staff')}</p></div>
                <div><p className="text-[10px] text-muted-foreground mb-0.5">Plano</p><p className="font-medium">{getPlanLabel(user?.plan || 'standard')}</p></div>
                <div><p className="text-[10px] text-muted-foreground mb-0.5">Limite Diário</p><p className="font-medium">{planLimit === -1 ? '∞' : planLimit}</p></div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;

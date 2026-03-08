import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, LogOut, Plus, Key, Users, Activity,
  Trash2, Search, RefreshCw, Copy, Check,
  AlertCircle, CheckCircle, XCircle, Clock, Download,
  BarChart3, FileText, Bell, Filter, Globe, Hash,
  Settings, Webhook, Edit, Save, X, Zap,
  Eye, EyeOff, Lock, ChevronRight
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

// ─── Types ─────────────────────────────────────────
interface License {
  id: string;
  license_key: string;
  owner_name: string;
  owner_email: string | null;
  resource_name: string;
  hwid: string | null;
  ip_address: string | null;
  port: number | null;
  status: string;
  expires_at: string | null;
  last_validated: string | null;
  validation_count: number;
  created_at: string;
  created_by: string | null;
}

interface ValidationLog {
  id: string;
  license_id: string | null;
  license_key: string | null;
  ip_address: string | null;
  result: string | null;
  success: boolean | null;
  error_message: string | null;
  validated_at: string | null;
}

interface AuditLog {
  id: string;
  user_id: string | null;
  username: string | null;
  action: string;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

interface LoginAttempt {
  id: string;
  username: string;
  ip_address: string | null;
  success: boolean;
  created_at: string;
}

interface StaffUser {
  id: string;
  username: string;
  email: string;
  role: string;
  plan: string;
  last_login: string | null;
  created_at: string;
  daily_license_count: number;
  last_license_date: string | null;
}

interface WebhookConfig {
  id: string;
  user_id: string;
  webhook_url: string;
  event_type: string;
  enabled: boolean;
  created_at: string;
}

const WEBHOOK_EVENTS = [
  { value: 'license_created', label: 'Licença Criada', icon: Plus, color: 'text-primary' },
  { value: 'license_edited', label: 'Licença Editada', icon: Edit, color: 'text-blue-400' },
  { value: 'license_suspended', label: 'Licença Suspensa', icon: AlertCircle, color: 'text-yellow-400' },
  { value: 'license_revoked', label: 'Licença Revogada', icon: XCircle, color: 'text-destructive' },
  { value: 'license_expired', label: 'Licença Expirada', icon: Clock, color: 'text-muted-foreground' },
  { value: 'license_validated', label: 'Licença Validada', icon: CheckCircle, color: 'text-primary' },
  { value: 'license_deleted', label: 'Licença Deletada', icon: Trash2, color: 'text-destructive' },
];

// ─── Main Component ────────────────────────────────
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("licenses");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editPlan, setEditPlan] = useState("");

  // Webhook form
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvent, setNewWebhookEvent] = useState("");

  const [newLicense, setNewLicense] = useState({
    owner_name: "",
    owner_email: "",
    resource_name: "",
    ip_address: "",
    port: "",
    status: "active",
    expires_at: ""
  });

  const isAdmin = user?.role === 'master_plus' || user?.role === 'master' || user?.role === 'admin';

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'dashboard', user_id: user?.id, user_role: user?.role }
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
      toast({ title: "Erro", description: "Não foi possível carregar os dados", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchDashboardData();
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    toast({ title: "Copiado!", description: "Chave copiada" });
  };

  const planLimit = user ? getPlanLimits(user.plan) : 5;
  const currentUser = staffUsers.find(s => s.id === user?.id);
  const todayCount = currentUser?.daily_license_count || 0;
  const isToday = currentUser?.last_license_date === new Date().toISOString().split('T')[0];
  const licensesUsedToday = isToday ? todayCount : 0;
  const canCreateLicense = planLimit === -1 || licensesUsedToday < planLimit;

  const createLicense = async () => {
    if (!newLicense.owner_name || !newLicense.resource_name) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    if (!canCreateLicense) {
      toast({ title: "Limite atingido", description: `Limite diário de ${planLimit} licenças`, variant: "destructive" });
      return;
    }

    try {
      const licenseKey = crypto.randomUUID();
      const { error } = await supabase.from('licenses').insert({
        license_key: licenseKey,
        owner_name: newLicense.owner_name,
        owner_email: newLicense.owner_email || null,
        resource_name: newLicense.resource_name,
        ip_address: newLicense.ip_address || null,
        port: newLicense.port ? parseInt(newLicense.port) : null,
        status: newLicense.status,
        expires_at: newLicense.expires_at || null,
        created_by: user?.id || null,
      });

      if (error) throw error;

      await supabase.functions.invoke('admin-auth', {
        body: {
          action: 'audit', user_id: user?.id, audit_username: user?.username,
          audit_action: 'CREATE_LICENSE',
          details: `License for ${newLicense.owner_name} - ${newLicense.resource_name}`
        }
      });

      // Fire webhook
      await supabase.functions.invoke('admin-auth', {
        body: {
          action: 'fire_webhooks', event_type: 'license_created',
          created_by_user_id: user?.id,
          license_data: { license_key: licenseKey, owner: newLicense.owner_name, resource: newLicense.resource_name }
        }
      });

      toast({ title: "Sucesso!", description: "Licença criada" });
      setIsCreateDialogOpen(false);
      setNewLicense({ owner_name: "", owner_email: "", resource_name: "", ip_address: "", port: "", status: "active", expires_at: "" });
      fetchDashboardData();
    } catch {
      toast({ title: "Erro", description: "Falha ao criar licença", variant: "destructive" });
    }
  };

  const updateLicenseStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('licenses').update({ status }).eq('id', id);
      if (error) throw error;

      const license = licenses.find(l => l.id === id);

      await supabase.functions.invoke('admin-auth', {
        body: {
          action: 'audit', user_id: user?.id, audit_username: user?.username,
          audit_action: 'UPDATE_LICENSE_STATUS', details: `License ${id} → ${status}`
        }
      });

      // Fire webhook based on status
      const eventMap: Record<string, string> = {
        suspended: 'license_suspended', revoked: 'license_revoked', active: 'license_edited'
      };
      if (eventMap[status]) {
        await supabase.functions.invoke('admin-auth', {
          body: {
            action: 'fire_webhooks', event_type: eventMap[status],
            created_by_user_id: license?.created_by,
            license_data: { license_key: license?.license_key, owner: license?.owner_name, status }
          }
        });
      }

      toast({ title: "Atualizado!" });
      fetchDashboardData();
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const deleteLicense = async (id: string) => {
    if (!confirm("Excluir esta licença?")) return;
    try {
      const license = licenses.find(l => l.id === id);
      const { error } = await supabase.from('licenses').delete().eq('id', id);
      if (error) throw error;

      await supabase.functions.invoke('admin-auth', {
        body: { action: 'audit', user_id: user?.id, audit_username: user?.username, audit_action: 'DELETE_LICENSE', details: `License ${id} deleted` }
      });

      await supabase.functions.invoke('admin-auth', {
        body: {
          action: 'fire_webhooks', event_type: 'license_deleted',
          created_by_user_id: license?.created_by,
          license_data: { license_key: license?.license_key, owner: license?.owner_name }
        }
      });

      toast({ title: "Excluída!" });
      fetchDashboardData();
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const updateUserRole = async (targetId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: {
          action: 'update_user_role',
          target_user_id: targetId,
          new_role: editRole,
          new_plan: editPlan,
          admin_user_id: user?.id,
          admin_username: user?.username,
        }
      });

      if (error || !data?.success) throw new Error('Failed');
      toast({ title: "Cargo atualizado!" });
      setEditingUser(null);
      fetchDashboardData();
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const saveWebhook = async () => {
    if (!newWebhookUrl || !newWebhookEvent) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: {
          action: 'save_webhook', user_id: user?.id,
          webhook_url: newWebhookUrl, event_type: newWebhookEvent, enabled: true,
        }
      });
      if (error || !data?.success) throw new Error('Failed');
      toast({ title: "Webhook salvo!" });
      setNewWebhookUrl("");
      setNewWebhookEvent("");
      fetchDashboardData();
    } catch {
      toast({ title: "Erro ao salvar webhook", variant: "destructive" });
    }
  };

  const toggleWebhook = async (wh: WebhookConfig) => {
    try {
      await supabase.functions.invoke('admin-auth', {
        body: {
          action: 'save_webhook', user_id: user?.id,
          webhook_url: wh.webhook_url, event_type: wh.event_type,
          enabled: !wh.enabled, webhook_id: wh.id,
        }
      });
      fetchDashboardData();
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const deleteWebhook = async (id: string) => {
    try {
      await supabase.functions.invoke('admin-auth', {
        body: { action: 'delete_webhook', webhook_id: id, user_id: user?.id }
      });
      toast({ title: "Webhook removido!" });
      fetchDashboardData();
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const filteredLicenses = useMemo(() => {
    return licenses.filter(license => {
      const matchesSearch = !searchTerm ||
        license.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.license_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.resource_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.ip_address?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || license.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [licenses, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    total: licenses.length,
    active: licenses.filter(l => l.status === 'active').length,
    expired: licenses.filter(l => l.status === 'expired').length,
    suspended: licenses.filter(l => l.status === 'suspended').length,
    revoked: licenses.filter(l => l.status === 'revoked').length,
    totalValidations: licenses.reduce((acc, l) => acc + (l.validation_count || 0), 0),
    failedLogins: loginAttempts.filter(l => !l.success).length,
    totalUsers: staffUsers.length,
  }), [licenses, loginAttempts, staffUsers]);

  const getStatusDot = (status: string) => {
    const cls: Record<string, string> = {
      active: 'status-active', suspended: 'status-suspended',
      revoked: 'status-revoked', expired: 'status-expired',
    };
    return <span className={`status-dot ${cls[status] || ''}`} />;
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = { active: 'Ativa', suspended: 'Suspensa', revoked: 'Revogada', expired: 'Expirada' };
    return map[status] || status;
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* ─── Background Effects ─── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="orb orb-primary w-[500px] h-[500px] -top-40 -right-40" />
        <div className="orb orb-accent w-[400px] h-[400px] bottom-20 -left-40" style={{ animationDelay: '5s' }} />
        <div className="orb orb-primary w-[300px] h-[300px] top-1/2 left-1/2" style={{ animationDelay: '10s', opacity: 0.08 }} />
        <div className="bg-grid absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/50 to-background" />
      </div>

      {/* ─── Header ─── */}
      <header className="border-b border-border/30 bg-card/70 backdrop-blur-2xl sticky top-0 z-50 relative">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="container mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg animate-pulse-ring" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text text-glow">Athilio Auth</h1>
                <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Secure Access Pro</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Role badge */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20">
                <Zap className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-semibold text-primary">{getRoleLabel(user?.role || 'staff')}</span>
                <span className="w-px h-3 bg-border" />
                <span className="text-[10px] text-muted-foreground">{getPlanLabel(user?.plan || 'standard')}</span>
              </div>

              {planLimit !== -1 && (
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/30">
                  <Key className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{licensesUsedToday}/{planLimit} hoje</span>
                </div>
              )}

              <Button variant="outline" size="sm" onClick={() => navigate("/downloads")} className="text-xs border-border/50">
                <Download className="w-3.5 h-3.5 mr-1.5" /> Downloads
              </Button>

              <span className="hidden md:inline text-xs text-muted-foreground font-medium">{user?.username}</span>

              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs text-muted-foreground hover:text-destructive">
                <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="container mx-auto px-4 md:px-6 py-6 relative z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full md:w-auto bg-card/80 backdrop-blur-xl border border-border/30 mb-6 p-1">
            <TabsTrigger value="licenses" className="text-xs gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Key className="w-3.5 h-3.5" /> Minhas Licenças
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="overview" className="text-xs gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <BarChart3 className="w-3.5 h-3.5" /> Painel Admin
                </TabsTrigger>
                <TabsTrigger value="users" className="text-xs gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <Users className="w-3.5 h-3.5" /> Usuários
                </TabsTrigger>
                <TabsTrigger value="logs" className="text-xs gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <FileText className="w-3.5 h-3.5" /> Logs
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="config" className="text-xs gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Settings className="w-3.5 h-3.5" /> Configurações
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════ LICENSES TAB ═══════════════════ */}
          <TabsContent value="licenses">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Plan limit warning */}
              {planLimit !== -1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`mb-4 p-4 rounded-xl border text-xs flex items-center gap-3 ${
                    canCreateLicense
                      ? 'bg-primary/5 border-primary/20 text-primary'
                      : 'bg-destructive/5 border-destructive/20 text-destructive'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${canCreateLicense ? 'bg-primary/20' : 'bg-destructive/20'}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  {canCreateLicense
                    ? `Plano ${getPlanLabel(user?.plan || 'standard')}: ${planLimit - licensesUsedToday} licenças restantes hoje`
                    : `Limite diário atingido (${planLimit}/${planLimit}). Upgrade para gerar mais.`
                  }
                </motion.div>
              )}

              {/* Actions bar */}
              <div className="flex flex-col md:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, chave, recurso ou IP..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-card/60 border-border/30 text-sm backdrop-blur-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36 bg-card/60 text-xs border-border/30">
                      <Filter className="w-3.5 h-3.5 mr-1.5" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativas</SelectItem>
                      <SelectItem value="suspended">Suspensas</SelectItem>
                      <SelectItem value="revoked">Revogadas</SelectItem>
                      <SelectItem value="expired">Expiradas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={fetchDashboardData} className="border-border/30">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" disabled={!canCreateLicense} className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary">
                        <Plus className="w-3.5 h-3.5 mr-1.5" /> Nova Licença
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border-border/30 max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="gradient-text text-lg">Criar Nova Licença</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 mt-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Proprietário *</label>
                            <Input value={newLicense.owner_name} onChange={(e) => setNewLicense({ ...newLicense, owner_name: e.target.value })} placeholder="João Silva" className="mt-1 bg-secondary/30 text-sm border-border/30" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Email</label>
                            <Input type="email" value={newLicense.owner_email} onChange={(e) => setNewLicense({ ...newLicense, owner_email: e.target.value })} placeholder="email@ex.com" className="mt-1 bg-secondary/30 text-sm border-border/30" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Recurso (script) *</label>
                          <Input value={newLicense.resource_name} onChange={(e) => setNewLicense({ ...newLicense, resource_name: e.target.value })} placeholder="meu-script-fivem" className="mt-1 bg-secondary/30 text-sm border-border/30" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">IP do Servidor</label>
                            <div className="relative mt-1">
                              <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                              <Input value={newLicense.ip_address} onChange={(e) => setNewLicense({ ...newLicense, ip_address: e.target.value })} placeholder="1.2.3.4" className="pl-8 bg-secondary/30 text-sm border-border/30" />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Porta</label>
                            <div className="relative mt-1">
                              <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                              <Input type="number" value={newLicense.port} onChange={(e) => setNewLicense({ ...newLicense, port: e.target.value })} placeholder="30120" className="pl-8 bg-secondary/30 text-sm border-border/30" />
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Status</label>
                            <Select value={newLicense.status} onValueChange={(v) => setNewLicense({ ...newLicense, status: v })}>
                              <SelectTrigger className="mt-1 bg-secondary/30 text-sm border-border/30"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Ativa</SelectItem>
                                <SelectItem value="suspended">Suspensa</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Expiração</label>
                            <Input type="datetime-local" value={newLicense.expires_at} onChange={(e) => setNewLicense({ ...newLicense, expires_at: e.target.value })} className="mt-1 bg-secondary/30 text-sm border-border/30" />
                          </div>
                        </div>
                        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary" onClick={createLicense} disabled={!canCreateLicense}>
                          <Zap className="w-4 h-4 mr-2" /> Gerar Licença
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Licenses Grid */}
              <div className="space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : filteredLicenses.length === 0 ? (
                  <div className="text-center py-20">
                    <Key className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhuma licença encontrada</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {filteredLicenses.map((license, i) => (
                      <motion.div
                        key={license.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: i * 0.03 }}
                        className="glass-card-hover p-4 rounded-xl"
                      >
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                          {/* License info */}
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <button onClick={() => copyToClipboard(license.license_key)} className="flex items-center gap-1.5 group">
                                  <code className="text-[10px] bg-secondary/50 px-2 py-1 rounded font-mono text-muted-foreground group-hover:text-primary transition-colors">
                                    {license.license_key.slice(0, 12)}...
                                  </code>
                                  {copiedKey === license.license_key
                                    ? <Check className="w-3 h-3 text-primary" />
                                    : <Copy className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                                  }
                                </button>
                              </div>
                              <p className="text-[10px] text-muted-foreground">Criada {formatDate(license.created_at)}</p>
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-foreground">{license.owner_name}</p>
                              {license.owner_email && <p className="text-[10px] text-muted-foreground">{license.owner_email}</p>}
                            </div>

                            <div>
                              <p className="text-xs text-foreground">{license.resource_name}</p>
                              <p className="text-[10px] font-mono text-muted-foreground">
                                {license.ip_address || '—'}{license.port ? `:${license.port}` : ''}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              {getStatusDot(license.status)}
                              <span className="text-xs font-medium">{getStatusLabel(license.status)}</span>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <p className="text-sm font-bold text-foreground">{license.validation_count}</p>
                                <p className="text-[10px] text-muted-foreground">validações</p>
                              </div>
                              {license.last_validated && (
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Última</p>
                                  <p className="text-[10px] text-muted-foreground">{formatDate(license.last_validated)}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Select value={license.status} onValueChange={(v) => updateLicenseStatus(license.id, v)}>
                              <SelectTrigger className="w-28 h-8 text-[10px] bg-secondary/30 border-border/30">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Ativar</SelectItem>
                                <SelectItem value="suspended">Suspender</SelectItem>
                                <SelectItem value="revoked">Revogar</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteLicense(license.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          </TabsContent>

          {/* ═══════════════════ OVERVIEW TAB (Admin Only) ═══════════════════ */}
          {isAdmin && (
            <TabsContent value="overview">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <StatCard icon={Key} label="Total Licenças" value={stats.total} />
                  <StatCard icon={CheckCircle} label="Ativas" value={stats.active} color="primary" />
                  <StatCard icon={Clock} label="Expiradas" value={stats.expired} />
                  <StatCard icon={Activity} label="Validações" value={stats.totalValidations} color="primary" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard icon={XCircle} label="Revogadas" value={stats.revoked} />
                  <StatCard icon={AlertCircle} label="Suspensas" value={stats.suspended} color="warning" />
                  <StatCard icon={Users} label="Usuários" value={stats.totalUsers} />
                  <StatCard icon={Bell} label="Logins Falhos" value={stats.failedLogins} color="destructive" />
                </div>

                {/* Recent activity */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="glass-card rounded-xl p-5 relative overflow-hidden scanline">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" /> Validações Recentes
                    </h3>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {validationLogs.slice(0, 15).map(log => (
                        <div key={log.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors text-xs">
                          <div className="flex items-center gap-2">
                            {log.success
                              ? <span className="status-dot status-active" />
                              : <span className="status-dot status-revoked" />
                            }
                            <span className="font-mono text-muted-foreground text-[10px]">
                              {log.license_key?.slice(0, 12) || '—'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {log.ip_address && <span className="text-[10px] font-mono text-muted-foreground">{log.ip_address}</span>}
                            {log.error_message && <span className="text-destructive text-[10px]">{log.error_message}</span>}
                            <span className="text-muted-foreground text-[10px]">{formatDate(log.validated_at)}</span>
                          </div>
                        </div>
                      ))}
                      {validationLogs.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-8">Nenhuma validação</p>
                      )}
                    </div>
                  </div>

                  <div className="glass-card rounded-xl p-5">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> Ações Recentes
                    </h3>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {auditLogs.slice(0, 15).map(log => (
                        <div key={log.id} className="py-2 px-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors text-xs">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-medium">{log.username || '—'}</span>
                            <span className="text-[10px] text-muted-foreground">{formatDate(log.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono">{log.action}</span>
                            <span className="text-muted-foreground text-[10px] truncate">{log.details}</span>
                          </div>
                        </div>
                      ))}
                      {auditLogs.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-8">Nenhuma ação</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          )}

          {/* ═══════════════════ USERS TAB (Admin Only) ═══════════════════ */}
          {isAdmin && (
            <TabsContent value="users">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="space-y-3">
                  {staffUsers.map(s => (
                    <div key={s.id} className="glass-card-hover p-4 rounded-xl">
                      <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center">
                              <span className="text-sm font-bold gradient-text">{s.username?.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="text-xs font-semibold">{s.username}</p>
                              <p className="text-[10px] text-muted-foreground">{s.email}</p>
                            </div>
                          </div>

                          <div>
                            {editingUser === s.id ? (
                              <Select value={editRole} onValueChange={setEditRole}>
                                <SelectTrigger className="h-8 text-[10px] bg-secondary/30 border-primary/30">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="staff">Staff</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="master">Master</SelectItem>
                                  <SelectItem value="master_plus">Master++</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className={`px-2 py-1 rounded-full text-[10px] font-semibold inline-flex items-center gap-1 ${
                                s.role === 'master_plus' ? 'bg-primary/15 text-primary border border-primary/20' :
                                s.role === 'master' ? 'bg-accent/15 text-accent-foreground border border-accent/20' :
                                s.role === 'admin' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
                                'bg-secondary/50 text-muted-foreground border border-border/30'
                              }`}>
                                <Zap className="w-2.5 h-2.5" />
                                {getRoleLabel(s.role)}
                              </span>
                            )}
                          </div>

                          <div>
                            {editingUser === s.id ? (
                              <Select value={editPlan} onValueChange={setEditPlan}>
                                <SelectTrigger className="h-8 text-[10px] bg-secondary/30 border-primary/30">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="standard">Padrão (5/dia)</SelectItem>
                                  <SelectItem value="master">Master (50/dia)</SelectItem>
                                  <SelectItem value="master_plus">Master++ (∞)</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-xs text-muted-foreground">{getPlanLabel(s.plan)}</span>
                            )}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {s.last_license_date === new Date().toISOString().split('T')[0]
                              ? `${s.daily_license_count}/${getPlanLimits(s.plan) === -1 ? '∞' : getPlanLimits(s.plan)} hoje`
                              : '0 hoje'
                            }
                          </div>

                          <div className="text-[10px] text-muted-foreground">
                            Login: {formatDate(s.last_login)}
                          </div>
                        </div>

                        {/* Edit actions */}
                        {user?.role === 'master_plus' && s.id !== user?.id && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {editingUser === s.id ? (
                              <>
                                <Button size="sm" className="h-8 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => updateUserRole(s.id)}>
                                  <Save className="w-3.5 h-3.5 mr-1" /> Salvar
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8" onClick={() => setEditingUser(null)}>
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            ) : (
                              <Button variant="outline" size="sm" className="h-8 border-border/30" onClick={() => {
                                setEditingUser(s.id);
                                setEditRole(s.role);
                                setEditPlan(s.plan);
                              }}>
                                <Edit className="w-3.5 h-3.5 mr-1" /> Editar Cargo
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {staffUsers.length === 0 && (
                    <div className="text-center py-16">
                      <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Nenhum usuário</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </TabsContent>
          )}

          {/* ═══════════════════ LOGS TAB (Admin Only) ═══════════════════ */}
          {isAdmin && (
            <TabsContent value="logs">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Tabs defaultValue="validation" className="w-full">
                  <TabsList className="bg-card/80 border border-border/30 mb-4">
                    <TabsTrigger value="validation" className="text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                      <Activity className="w-3.5 h-3.5 mr-1.5" /> Validações
                    </TabsTrigger>
                    <TabsTrigger value="audit" className="text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                      <FileText className="w-3.5 h-3.5 mr-1.5" /> Auditoria
                    </TabsTrigger>
                    <TabsTrigger value="login" className="text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                      <Lock className="w-3.5 h-3.5 mr-1.5" /> Login
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="validation">
                    <div className="glass-card rounded-xl overflow-hidden">
                      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <table className="w-full">
                          <thead className="sticky top-0 bg-card/95 backdrop-blur-sm">
                            <tr className="border-b border-border/30">
                              <th className="text-left text-[10px] font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Status</th>
                              <th className="text-left text-[10px] font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Licença</th>
                              <th className="text-left text-[10px] font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">IP</th>
                              <th className="text-left text-[10px] font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Resultado</th>
                              <th className="text-left text-[10px] font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Erro</th>
                              <th className="text-left text-[10px] font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Data</th>
                            </tr>
                          </thead>
                          <tbody>
                            {validationLogs.map(log => (
                              <tr key={log.id} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                                <td className="px-4 py-2.5">
                                  <span className={`status-dot ${log.success ? 'status-active' : 'status-revoked'}`} />
                                </td>
                                <td className="px-4 py-2.5 text-[10px] font-mono text-muted-foreground">
                                  {log.license_key?.slice(0, 16) || log.license_id?.slice(0, 16) || '—'}
                                </td>
                                <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">{log.ip_address || '—'}</td>
                                <td className="px-4 py-2.5">
                                  <span className={`text-[10px] font-medium ${log.success ? 'text-primary' : 'text-destructive'}`}>
                                    {log.result || '—'}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-[10px] text-destructive">{log.error_message || '—'}</td>
                                <td className="px-4 py-2.5 text-[10px] text-muted-foreground">{formatDate(log.validated_at)}</td>
                              </tr>
                            ))}
                            {validationLogs.length === 0 && (
                              <tr><td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">Sem validações</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="audit">
                    <div className="glass-card rounded-xl overflow-hidden">
                      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <table className="w-full">
                          <thead className="sticky top-0 bg-card/95 backdrop-blur-sm">
                            <tr className="border-b border-border/30">
                              <th className="text-left text-[10px] font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Usuário</th>
                              <th className="text-left text-[10px] font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Ação</th>
                              <th className="text-left text-[10px] font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Detalhes</th>
                              <th className="text-left text-[10px] font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">IP</th>
                              <th className="text-left text-[10px] font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Data</th>
                            </tr>
                          </thead>
                          <tbody>
                            {auditLogs.map(log => (
                              <tr key={log.id} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                                <td className="px-4 py-2.5 text-xs font-medium">{log.username || '—'}</td>
                                <td className="px-4 py-2.5">
                                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono">{log.action}</span>
                                </td>
                                <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-xs truncate">{log.details || '—'}</td>
                                <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">{log.ip_address || '—'}</td>
                                <td className="px-4 py-2.5 text-[10px] text-muted-foreground">{formatDate(log.created_at)}</td>
                              </tr>
                            ))}
                            {auditLogs.length === 0 && (
                              <tr><td colSpan={5} className="text-center py-12 text-sm text-muted-foreground">Sem registros</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="login">
                    <div className="glass-card rounded-xl overflow-hidden">
                      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <table className="w-full">
                          <thead className="sticky top-0 bg-card/95 backdrop-blur-sm">
                            <tr className="border-b border-border/30">
                              <th className="text-left text-[10px] font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Status</th>
                              <th className="text-left text-[10px] font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Usuário</th>
                              <th className="text-left text-[10px] font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">IP</th>
                              <th className="text-left text-[10px] font-medium text-muted-foreground px-4 py-3 uppercase tracking-wider">Data</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loginAttempts.map(a => (
                              <tr key={a.id} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                                <td className="px-4 py-2.5">
                                  <span className={`status-dot ${a.success ? 'status-active' : 'status-revoked'}`} />
                                </td>
                                <td className="px-4 py-2.5 text-xs font-medium">{a.username}</td>
                                <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">{a.ip_address || '—'}</td>
                                <td className="px-4 py-2.5 text-[10px] text-muted-foreground">{formatDate(a.created_at)}</td>
                              </tr>
                            ))}
                            {loginAttempts.length === 0 && (
                              <tr><td colSpan={4} className="text-center py-12 text-sm text-muted-foreground">Sem tentativas</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </motion.div>
            </TabsContent>
          )}

          {/* ═══════════════════ CONFIG TAB (Webhooks) ═══════════════════ */}
          <TabsContent value="config">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="glass-card rounded-xl p-6 mb-6">
                <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                  <Webhook className="w-4 h-4 text-primary" />
                  <span className="gradient-text">Webhooks</span>
                </h3>
                <p className="text-[10px] text-muted-foreground mb-5">
                  Receba notificações em tempo real quando eventos ocorrerem nas suas licenças.
                </p>

                {/* Add webhook form */}
                <div className="flex flex-col md:flex-row gap-3 mb-6 p-4 rounded-xl bg-secondary/20 border border-border/20">
                  <div className="flex-1">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">URL do Webhook</label>
                    <Input
                      value={newWebhookUrl}
                      onChange={(e) => setNewWebhookUrl(e.target.value)}
                      placeholder="https://discord.com/api/webhooks/..."
                      className="bg-card/60 border-border/30 text-xs"
                    />
                  </div>
                  <div className="w-full md:w-56">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Evento</label>
                    <Select value={newWebhookEvent} onValueChange={setNewWebhookEvent}>
                      <SelectTrigger className="bg-card/60 border-border/30 text-xs">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {WEBHOOK_EVENTS.map(evt => (
                          <SelectItem key={evt.value} value={evt.value}>
                            <span className="flex items-center gap-2">
                              <evt.icon className={`w-3 h-3 ${evt.color}`} />
                              {evt.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={saveWebhook} className="bg-primary text-primary-foreground hover:bg-primary/90 h-10">
                      <Plus className="w-4 h-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                </div>

                {/* Existing webhooks */}
                <div className="space-y-2">
                  {webhooks.length === 0 ? (
                    <div className="text-center py-12">
                      <Webhook className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-xs text-muted-foreground">Nenhum webhook configurado</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Adicione webhooks para receber notificações de eventos</p>
                    </div>
                  ) : (
                    webhooks.map(wh => {
                      const evtInfo = WEBHOOK_EVENTS.find(e => e.value === wh.event_type);
                      const EvtIcon = evtInfo?.icon || Bell;

                      return (
                        <motion.div
                          key={wh.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-secondary/15 border border-border/20 hover:border-border/40 transition-all"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${wh.enabled ? 'bg-primary/10' : 'bg-secondary/30'}`}>
                            <EvtIcon className={`w-4 h-4 ${wh.enabled ? (evtInfo?.color || 'text-primary') : 'text-muted-foreground'}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">{evtInfo?.label || wh.event_type}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${wh.enabled ? 'bg-primary/10 text-primary' : 'bg-secondary/50 text-muted-foreground'}`}>
                                {wh.enabled ? 'Ativo' : 'Desativado'}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-mono truncate">{wh.webhook_url}</p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Switch checked={wh.enabled} onCheckedChange={() => toggleWebhook(wh)} />
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteWebhook(wh.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* User info card */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="gradient-text">Sua Conta</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Usuário</p>
                    <p className="text-sm font-semibold">{user?.username}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Cargo</p>
                    <p className="text-sm font-semibold text-primary">{getRoleLabel(user?.role || 'staff')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Plano</p>
                    <p className="text-sm font-semibold">{getPlanLabel(user?.plan || 'standard')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Limite Diário</p>
                    <p className="text-sm font-semibold">{planLimit === -1 ? '∞ Ilimitado' : `${planLimit} licenças`}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// ─── Stat Card Component ───────────────────────────
const StatCard = ({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: number; color?: 'primary' | 'destructive' | 'warning';
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="glass-card-hover p-4 rounded-xl relative overflow-hidden"
  >
    <div className="flex items-center gap-3 relative z-10">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        color === 'primary' ? 'bg-primary/15 border border-primary/20' :
        color === 'destructive' ? 'bg-destructive/15 border border-destructive/20' :
        color === 'warning' ? 'bg-yellow-500/15 border border-yellow-500/20' :
        'bg-secondary/50 border border-border/30'
      }`}>
        <Icon className={`w-5 h-5 ${
          color === 'primary' ? 'text-primary' :
          color === 'destructive' ? 'text-destructive' :
          color === 'warning' ? 'text-yellow-400' :
          'text-muted-foreground'
        }`} />
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-[10px] text-muted-foreground tracking-wider uppercase">{label}</div>
      </div>
    </div>
    {color === 'primary' && (
      <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-primary/5 rounded-full blur-xl" />
    )}
  </motion.div>
);

export default Admin;

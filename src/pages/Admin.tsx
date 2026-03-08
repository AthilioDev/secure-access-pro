import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Shield, LogOut, Plus, Key, Users, Activity,
  Trash2, Search, RefreshCw, Copy, Check,
  AlertCircle, CheckCircle, XCircle, Clock, Download,
  BarChart3, FileText, Bell, Filter, ChevronDown, Globe, Hash
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

const Admin = () => {
  const { isAuthenticated, user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [licenses, setLicenses] = useState<License[]>([]);
  const [validationLogs, setValidationLogs] = useState<ValidationLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [newLicense, setNewLicense] = useState({
    owner_name: "",
    owner_email: "",
    resource_name: "",
    ip_address: "",
    port: "",
    status: "active",
    expires_at: ""
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'dashboard' }
      });

      if (error) throw error;
      if (data?.success) {
        setLicenses(data.licenses || []);
        setValidationLogs(data.validationLogs || []);
        setAuditLogs(data.auditLogs || []);
        setLoginAttempts(data.loginAttempts || []);
        setStaffUsers(data.adminUsers || []);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
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
      toast({
        title: "Limite atingido",
        description: `Você atingiu o limite diário de ${planLimit} licenças do plano ${getPlanLabel(user?.plan || 'standard')}`,
        variant: "destructive"
      });
      return;
    }

    try {
      const licenseKey = crypto.randomUUID();
      const { error } = await supabase
        .from('licenses')
        .insert({
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

      // Log audit
      await supabase.functions.invoke('admin-auth', {
        body: {
          action: 'audit',
          user_id: user?.id,
          audit_username: user?.username,
          audit_action: 'CREATE_LICENSE',
          details: `License created for ${newLicense.owner_name} - Resource: ${newLicense.resource_name}`
        }
      });

      toast({ title: "Sucesso!", description: "Licença criada com sucesso" });
      setIsCreateDialogOpen(false);
      setNewLicense({ owner_name: "", owner_email: "", resource_name: "", ip_address: "", port: "", status: "active", expires_at: "" });
      fetchDashboardData();
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível criar a licença", variant: "destructive" });
    }
  };

  const updateLicenseStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('licenses').update({ status }).eq('id', id);
      if (error) throw error;

      await supabase.functions.invoke('admin-auth', {
        body: {
          action: 'audit',
          user_id: user?.id,
          audit_username: user?.username,
          audit_action: 'UPDATE_LICENSE_STATUS',
          details: `License ${id} status changed to ${status}`
        }
      });

      toast({ title: "Sucesso!", description: "Status atualizado" });
      fetchDashboardData();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao atualizar status", variant: "destructive" });
    }
  };

  const deleteLicense = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta licença?")) return;
    try {
      const { error } = await supabase.from('licenses').delete().eq('id', id);
      if (error) throw error;

      await supabase.functions.invoke('admin-auth', {
        body: {
          action: 'audit',
          user_id: user?.id,
          audit_username: user?.username,
          audit_action: 'DELETE_LICENSE',
          details: `License ${id} deleted`
        }
      });

      toast({ title: "Sucesso!", description: "Licença excluída" });
      fetchDashboardData();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao excluir licença", variant: "destructive" });
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-primary" />;
      case 'suspended': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'revoked': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'expired': return <Clock className="w-4 h-4 text-muted-foreground" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = { active: 'Ativa', suspended: 'Suspensa', revoked: 'Revogada', expired: 'Expirada' };
    return map[status] || status;
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-7 h-7 text-primary" />
              <div>
                <h1 className="text-lg font-bold gradient-text">Athilio Auth</h1>
                <p className="text-[10px] text-muted-foreground">Secure Access Pro</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Plan badge */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-[10px] font-medium text-primary">{getRoleLabel(user?.role || 'staff')}</span>
                <span className="text-[10px] text-muted-foreground">•</span>
                <span className="text-[10px] text-muted-foreground">{getPlanLabel(user?.plan || 'standard')}</span>
              </div>

              {/* License limit indicator */}
              {planLimit !== -1 && (
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/30">
                  <Key className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    {licensesUsedToday}/{planLimit} hoje
                  </span>
                </div>
              )}

              <Button variant="outline" size="sm" onClick={() => navigate("/downloads")} className="text-xs">
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Downloads
              </Button>

              <span className="hidden md:inline text-xs text-muted-foreground">
                {user?.username}
              </span>

              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs">
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full md:w-auto bg-secondary/30 border border-border/30 mb-6">
            <TabsTrigger value="overview" className="text-xs gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Visão Geral
            </TabsTrigger>
            <TabsTrigger value="licenses" className="text-xs gap-1.5">
              <Key className="w-3.5 h-3.5" /> Licenças
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs gap-1.5">
              <Users className="w-3.5 h-3.5" /> Usuários
            </TabsTrigger>
            <TabsTrigger value="logs" className="text-xs gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Logs
            </TabsTrigger>
          </TabsList>

          {/* ===================== OVERVIEW TAB ===================== */}
          <TabsContent value="overview">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard icon={Key} label="Total Licenças" value={stats.total.toString()} />
                <StatCard icon={CheckCircle} label="Ativas" value={stats.active.toString()} highlight />
                <StatCard icon={Clock} label="Expiradas" value={stats.expired.toString()} />
                <StatCard icon={Activity} label="Validações" value={stats.totalValidations.toString()} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard icon={XCircle} label="Revogadas" value={stats.revoked.toString()} />
                <StatCard icon={AlertCircle} label="Suspensas" value={stats.suspended.toString()} />
                <StatCard icon={Users} label="Usuários" value={stats.totalUsers.toString()} />
                <StatCard icon={Bell} label="Logins Falhos" value={stats.failedLogins.toString()} variant="destructive" />
              </div>

              {/* Recent Activity */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Recent Validations */}
                <div className="glass-card rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Validações Recentes
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {validationLogs.slice(0, 10).map(log => (
                      <div key={log.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/20 text-xs">
                        <div className="flex items-center gap-2">
                          {log.success ? (
                            <CheckCircle className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-destructive" />
                          )}
                          <span className="font-mono text-muted-foreground">
                            {log.license_key?.slice(0, 8) || log.license_id?.slice(0, 8) || '—'}...
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {log.error_message && (
                            <span className="text-destructive text-[10px]">{log.error_message}</span>
                          )}
                          <span className="text-muted-foreground text-[10px]">{formatDate(log.validated_at)}</span>
                        </div>
                      </div>
                    ))}
                    {validationLogs.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">Nenhuma validação registrada</p>
                    )}
                  </div>
                </div>

                {/* Recent Audit */}
                <div className="glass-card rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Ações Recentes
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {auditLogs.slice(0, 10).map(log => (
                      <div key={log.id} className="py-2 px-3 rounded-lg bg-secondary/20 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-foreground">{log.username || '—'}</span>
                          <span className="text-muted-foreground text-[10px]">{formatDate(log.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono">{log.action}</span>
                          <span className="text-muted-foreground truncate">{log.details}</span>
                        </div>
                      </div>
                    ))}
                    {auditLogs.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">Nenhuma ação registrada</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* ===================== LICENSES TAB ===================== */}
          <TabsContent value="licenses">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Plan limit warning */}
              {planLimit !== -1 && (
                <div className={`mb-4 p-3 rounded-lg border text-xs flex items-center gap-2 ${
                  canCreateLicense
                    ? 'bg-primary/5 border-primary/20 text-primary'
                    : 'bg-destructive/5 border-destructive/20 text-destructive'
                }`}>
                  <Bell className="w-4 h-4" />
                  {canCreateLicense
                    ? `Plano ${getPlanLabel(user?.plan || 'standard')}: ${planLimit - licensesUsedToday} licenças restantes hoje`
                    : `Limite diário atingido (${planLimit}/${planLimit}). Upgrade para gerar mais.`
                  }
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col md:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, chave, recurso ou IP..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-secondary/30 border-border/50 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36 bg-secondary/30 text-xs">
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
                  <Button variant="outline" size="sm" onClick={fetchDashboardData}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Atualizar
                  </Button>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="hero" size="sm" disabled={!canCreateLicense}>
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Nova Licença
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border-border/50 max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="gradient-text">Criar Nova Licença</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 mt-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium">Nome do Proprietário *</label>
                            <Input value={newLicense.owner_name} onChange={(e) => setNewLicense({ ...newLicense, owner_name: e.target.value })} placeholder="Ex: João Silva" className="mt-1 bg-secondary/30 text-sm" />
                          </div>
                          <div>
                            <label className="text-xs font-medium">Email</label>
                            <Input type="email" value={newLicense.owner_email} onChange={(e) => setNewLicense({ ...newLicense, owner_email: e.target.value })} placeholder="email@exemplo.com" className="mt-1 bg-secondary/30 text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium">Nome do Recurso (script) *</label>
                          <Input value={newLicense.resource_name} onChange={(e) => setNewLicense({ ...newLicense, resource_name: e.target.value })} placeholder="Ex: meu-script-fivem" className="mt-1 bg-secondary/30 text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium">IP do Servidor</label>
                            <div className="relative mt-1">
                              <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                              <Input value={newLicense.ip_address} onChange={(e) => setNewLicense({ ...newLicense, ip_address: e.target.value })} placeholder="1.2.3.4" className="pl-8 bg-secondary/30 text-sm" />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium">Porta</label>
                            <div className="relative mt-1">
                              <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                              <Input type="number" value={newLicense.port} onChange={(e) => setNewLicense({ ...newLicense, port: e.target.value })} placeholder="30120" className="pl-8 bg-secondary/30 text-sm" />
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium">Status</label>
                            <Select value={newLicense.status} onValueChange={(v) => setNewLicense({ ...newLicense, status: v })}>
                              <SelectTrigger className="mt-1 bg-secondary/30 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Ativa</SelectItem>
                                <SelectItem value="suspended">Suspensa</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs font-medium">Expiração</label>
                            <Input type="datetime-local" value={newLicense.expires_at} onChange={(e) => setNewLicense({ ...newLicense, expires_at: e.target.value })} className="mt-1 bg-secondary/30 text-sm" />
                          </div>
                        </div>
                        <Button variant="hero" className="w-full" onClick={createLicense} disabled={!canCreateLicense}>
                          Criar Licença
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Licenses Table */}
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Licença</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Proprietário</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Recurso</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">IP:Porta</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Validações</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Expira</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan={8} className="text-center py-12">
                          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                        </td></tr>
                      ) : filteredLicenses.length === 0 ? (
                        <tr><td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">Nenhuma licença encontrada</td></tr>
                      ) : (
                        filteredLicenses.map((license) => (
                          <tr key={license.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <code className="text-[10px] bg-secondary/50 px-1.5 py-0.5 rounded font-mono">
                                  {license.license_key.slice(0, 8)}...
                                </code>
                                <button onClick={() => copyToClipboard(license.license_key)} className="text-muted-foreground hover:text-primary transition-colors">
                                  {copiedKey === license.license_key ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs font-medium">{license.owner_name}</div>
                              {license.owner_email && <div className="text-[10px] text-muted-foreground">{license.owner_email}</div>}
                            </td>
                            <td className="px-4 py-3 text-xs">{license.resource_name}</td>
                            <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                              {license.ip_address || '—'}{license.port ? `:${license.port}` : ''}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                {getStatusIcon(license.status)}
                                <span className="text-xs">{getStatusLabel(license.status)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{license.validation_count}</td>
                            <td className="px-4 py-3 text-[10px] text-muted-foreground">{formatDate(license.expires_at)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <Select value={license.status} onValueChange={(v) => updateLicenseStatus(license.id, v)}>
                                  <SelectTrigger className="w-24 h-7 text-[10px] bg-secondary/30"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">Ativar</SelectItem>
                                    <SelectItem value="suspended">Suspender</SelectItem>
                                    <SelectItem value="revoked">Revogar</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteLicense(license.id)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* ===================== USERS TAB ===================== */}
          <TabsContent value="users">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Usuário</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Email</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Cargo</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Plano</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Licenças Hoje</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Último Login</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Criado em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffUsers.map(s => (
                        <tr key={s.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3 text-xs font-medium">{s.username}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{s.email}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              s.role === 'master_plus' ? 'bg-primary/20 text-primary' :
                              s.role === 'master' ? 'bg-accent/20 text-accent-foreground' :
                              'bg-secondary/50 text-muted-foreground'
                            }`}>
                              {getRoleLabel(s.role)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs">{getPlanLabel(s.plan)}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {s.last_license_date === new Date().toISOString().split('T')[0]
                              ? `${s.daily_license_count}/${getPlanLimits(s.plan) === -1 ? '∞' : getPlanLimits(s.plan)}`
                              : '0'
                            }
                          </td>
                          <td className="px-4 py-3 text-[10px] text-muted-foreground">{formatDate(s.last_login)}</td>
                          <td className="px-4 py-3 text-[10px] text-muted-foreground">{formatDate(s.created_at)}</td>
                        </tr>
                      ))}
                      {staffUsers.length === 0 && (
                        <tr><td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">Nenhum usuário</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* ===================== LOGS TAB ===================== */}
          <TabsContent value="logs">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Tabs defaultValue="validation" className="w-full">
                <TabsList className="bg-secondary/30 border border-border/30 mb-4">
                  <TabsTrigger value="validation" className="text-xs">Validações</TabsTrigger>
                  <TabsTrigger value="audit" className="text-xs">Auditoria</TabsTrigger>
                  <TabsTrigger value="login" className="text-xs">Login Attempts</TabsTrigger>
                </TabsList>

                {/* Validation Logs */}
                <TabsContent value="validation">
                  <div className="glass-card rounded-xl overflow-hidden">
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-card">
                          <tr className="border-b border-border/30">
                            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Licença</th>
                            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">IP</th>
                            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Resultado</th>
                            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Erro</th>
                            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {validationLogs.map(log => (
                            <tr key={log.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                              <td className="px-4 py-2">
                                {log.success ? (
                                  <CheckCircle className="w-4 h-4 text-primary" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-destructive" />
                                )}
                              </td>
                              <td className="px-4 py-2 text-[10px] font-mono text-muted-foreground">
                                {log.license_key?.slice(0, 12) || log.license_id?.slice(0, 12) || '—'}...
                              </td>
                              <td className="px-4 py-2 text-xs text-muted-foreground">{log.ip_address || '—'}</td>
                              <td className="px-4 py-2 text-xs">{log.result || '—'}</td>
                              <td className="px-4 py-2 text-[10px] text-destructive">{log.error_message || '—'}</td>
                              <td className="px-4 py-2 text-[10px] text-muted-foreground">{formatDate(log.validated_at)}</td>
                            </tr>
                          ))}
                          {validationLogs.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-8 text-sm text-muted-foreground">Sem validações</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>

                {/* Audit Logs */}
                <TabsContent value="audit">
                  <div className="glass-card rounded-xl overflow-hidden">
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-card">
                          <tr className="border-b border-border/30">
                            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Usuário</th>
                            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Ação</th>
                            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Detalhes</th>
                            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">IP</th>
                            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.map(log => (
                            <tr key={log.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                              <td className="px-4 py-2 text-xs font-medium">{log.username || '—'}</td>
                              <td className="px-4 py-2">
                                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono">{log.action}</span>
                              </td>
                              <td className="px-4 py-2 text-xs text-muted-foreground max-w-xs truncate">{log.details || '—'}</td>
                              <td className="px-4 py-2 text-xs text-muted-foreground font-mono">{log.ip_address || '—'}</td>
                              <td className="px-4 py-2 text-[10px] text-muted-foreground">{formatDate(log.created_at)}</td>
                            </tr>
                          ))}
                          {auditLogs.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-8 text-sm text-muted-foreground">Sem registros</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>

                {/* Login Attempts */}
                <TabsContent value="login">
                  <div className="glass-card rounded-xl overflow-hidden">
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-card">
                          <tr className="border-b border-border/30">
                            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Usuário</th>
                            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">IP</th>
                            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loginAttempts.map(attempt => (
                            <tr key={attempt.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                              <td className="px-4 py-2">
                                {attempt.success ? (
                                  <CheckCircle className="w-4 h-4 text-primary" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-destructive" />
                                )}
                              </td>
                              <td className="px-4 py-2 text-xs font-medium">{attempt.username}</td>
                              <td className="px-4 py-2 text-xs text-muted-foreground font-mono">{attempt.ip_address || '—'}</td>
                              <td className="px-4 py-2 text-[10px] text-muted-foreground">{formatDate(attempt.created_at)}</td>
                            </tr>
                          ))}
                          {loginAttempts.length === 0 && (
                            <tr><td colSpan={4} className="text-center py-8 text-sm text-muted-foreground">Sem tentativas</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, highlight, variant }: {
  icon: any;
  label: string;
  value: string;
  highlight?: boolean;
  variant?: 'destructive';
}) => (
  <div className={`glass-card p-4 rounded-xl ${highlight ? 'border-primary/30' : ''}`}>
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        highlight ? 'bg-primary/20' :
        variant === 'destructive' ? 'bg-destructive/10' :
        'bg-secondary/50'
      }`}>
        <Icon className={`w-5 h-5 ${
          highlight ? 'text-primary' :
          variant === 'destructive' ? 'text-destructive' :
          'text-muted-foreground'
        }`} />
      </div>
      <div>
        <div className="text-xl font-bold text-foreground">{value}</div>
        <div className="text-[10px] text-muted-foreground">{label}</div>
      </div>
    </div>
  </div>
);

export default Admin;

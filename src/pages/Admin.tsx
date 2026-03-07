import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Shield, LogOut, Plus, Key, Users, Activity, 
  Trash2, Edit2, Search, RefreshCw, Copy, Check,
  AlertCircle, CheckCircle, XCircle, Clock, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface License {
  id: string;
  license_key: string;
  owner_name: string;
  owner_email: string | null;
  resource_name: string;
  hwid: string | null;
  ip_address: string | null;
  status: string;
  expires_at: string | null;
  last_validated: string | null;
  validation_count: number;
  created_at: string;
}

const Admin = () => {
  const { isAuthenticated, user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Form state
  const [newLicense, setNewLicense] = useState({
    owner_name: "",
    owner_email: "",
    resource_name: "",
    status: "active",
    expires_at: ""
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const fetchLicenses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLicenses(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as licenças",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchLicenses();
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
    toast({
      title: "Copiado!",
      description: "Chave de licença copiada para a área de transferência"
    });
  };

  const createLicense = async () => {
    if (!newLicense.owner_name || !newLicense.resource_name) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('licenses')
        .insert({
          owner_name: newLicense.owner_name,
          owner_email: newLicense.owner_email || null,
          resource_name: newLicense.resource_name,
          status: newLicense.status,
          expires_at: newLicense.expires_at || null
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Licença criada com sucesso"
      });
      setIsCreateDialogOpen(false);
      setNewLicense({ owner_name: "", owner_email: "", resource_name: "", status: "active", expires_at: "" });
      fetchLicenses();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a licença",
        variant: "destructive"
      });
    }
  };

  const updateLicenseStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('licenses')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Status atualizado"
      });
      fetchLicenses();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive"
      });
    }
  };

  const deleteLicense = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta licença?")) return;

    try {
      const { error } = await supabase
        .from('licenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Licença excluída"
      });
      fetchLicenses();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a licença",
        variant: "destructive"
      });
    }
  };

  const filteredLicenses = licenses.filter(license =>
    license.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.license_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.resource_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    switch (status) {
      case 'active': return 'Ativa';
      case 'suspended': return 'Suspensa';
      case 'revoked': return 'Revogada';
      case 'expired': return 'Expirada';
      default: return status;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold gradient-text">Athilio Auth</h1>
                <p className="text-xs text-muted-foreground">Painel Administrativo</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Olá, <span className="text-foreground font-medium">{user?.username}</span>
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-4 gap-6 mb-8"
        >
          <StatCard
            icon={Key}
            label="Total de Licenças"
            value={licenses.length.toString()}
          />
          <StatCard
            icon={CheckCircle}
            label="Licenças Ativas"
            value={licenses.filter(l => l.status === 'active').length.toString()}
            highlight
          />
          <StatCard
            icon={AlertCircle}
            label="Suspensas"
            value={licenses.filter(l => l.status === 'suspended').length.toString()}
          />
          <StatCard
            icon={Activity}
            label="Validações Hoje"
            value={licenses.reduce((acc, l) => acc + (l.validation_count || 0), 0).toString()}
          />
        </motion.div>

        {/* Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar licenças..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-secondary/30 border-border/50"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchLicenses}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Licença
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-border/50">
                <DialogHeader>
                  <DialogTitle className="gradient-text">Criar Nova Licença</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium">Nome do Proprietário *</label>
                    <Input
                      value={newLicense.owner_name}
                      onChange={(e) => setNewLicense({ ...newLicense, owner_name: e.target.value })}
                      placeholder="Ex: João Silva"
                      className="mt-1 bg-secondary/30"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={newLicense.owner_email}
                      onChange={(e) => setNewLicense({ ...newLicense, owner_email: e.target.value })}
                      placeholder="email@exemplo.com"
                      className="mt-1 bg-secondary/30"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Nome do Recurso *</label>
                    <Input
                      value={newLicense.resource_name}
                      onChange={(e) => setNewLicense({ ...newLicense, resource_name: e.target.value })}
                      placeholder="Ex: meu-script-fivem"
                      className="mt-1 bg-secondary/30"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={newLicense.status}
                      onValueChange={(value) => setNewLicense({ ...newLicense, status: value })}
                    >
                      <SelectTrigger className="mt-1 bg-secondary/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativa</SelectItem>
                        <SelectItem value="suspended">Suspensa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Data de Expiração</label>
                    <Input
                      type="datetime-local"
                      value={newLicense.expires_at}
                      onChange={(e) => setNewLicense({ ...newLicense, expires_at: e.target.value })}
                      className="mt-1 bg-secondary/30"
                    />
                  </div>
                  <Button variant="hero" className="w-full" onClick={createLicense}>
                    Criar Licença
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Licenses Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Licença</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Proprietário</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Recurso</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Status</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Validações</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filteredLicenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      Nenhuma licença encontrada
                    </td>
                  </tr>
                ) : (
                  filteredLicenses.map((license) => (
                    <tr key={license.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-secondary/50 px-2 py-1 rounded font-mono">
                            {license.license_key.slice(0, 8)}...
                          </code>
                          <button
                            onClick={() => copyToClipboard(license.license_key)}
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            {copiedKey === license.license_key ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-foreground">{license.owner_name}</div>
                          {license.owner_email && (
                            <div className="text-xs text-muted-foreground">{license.owner_email}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">{license.resource_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(license.status)}
                          <span className="text-sm">{getStatusLabel(license.status)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">{license.validation_count}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Select
                            value={license.status}
                            onValueChange={(value) => updateLicenseStatus(license.id, value)}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs bg-secondary/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Ativar</SelectItem>
                              <SelectItem value="suspended">Suspender</SelectItem>
                              <SelectItem value="revoked">Revogar</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteLicense(license.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, highlight }: { 
  icon: any; 
  label: string; 
  value: string;
  highlight?: boolean;
}) => (
  <div className={`glass-card p-6 rounded-xl ${highlight ? 'border-primary/30' : ''}`}>
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${highlight ? 'bg-primary/20' : 'bg-secondary/50'}`}>
        <Icon className={`w-6 h-6 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  </div>
);

export default Admin;
import { useState } from "react";
import { Shield, Lock, User, ArrowRight, Eye, EyeOff, Mail, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    if (isRegister && !email.trim()) {
      toast({ title: "Email é obrigatório", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      if (isRegister) {
        await register(username.trim(), password, email.trim());
        toast({ title: "Conta criada com sucesso!" });
      } else {
        await login(username.trim(), password);
      }
      navigate("/admin");
    } catch (error: any) {
      toast({ title: error.message || "Erro", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background admin-bg bg-noise px-4">
      <div className="w-full max-w-sm">
        <div className="glass-card p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-secondary border border-border/40 mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-base font-bold">Athilio Auth</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isRegister ? "Crie sua conta" : "Acesse o painel"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Usuário</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" className="pl-9 h-9 text-sm bg-background border-border rounded-lg" />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" className="pl-9 h-9 text-sm bg-background border-border rounded-lg" />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Senha</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" className="pl-9 pr-10 h-9 text-sm bg-background border-border rounded-lg" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-9 bg-foreground text-background hover:bg-foreground/90 rounded-lg text-sm font-medium" disabled={isLoading}>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              ) : isRegister ? (
                <><UserPlus className="w-3.5 h-3.5 mr-1" /> Criar Conta</>
              ) : (
                <>Entrar <ArrowRight className="w-3.5 h-3.5 ml-1" /></>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {isRegister ? "Já tem conta? Entrar" : "Não tem conta? Registrar"}
            </button>
            <div>
              <a href="/" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">← Voltar</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

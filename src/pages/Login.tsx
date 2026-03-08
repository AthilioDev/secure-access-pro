import { useState } from "react";
import { Shield, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await login(username.trim(), password);
      toast({ title: "Login realizado" });
      navigate("/admin");
    } catch (error) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : "Credenciais inválidas", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background admin-rustic px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur p-7">
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-secondary border border-border/50 mb-4">
              <Shield className="w-5 h-5 text-foreground" />
            </div>
            <h1 className="text-lg font-bold">Secure Access Pro</h1>
            <p className="text-xs text-muted-foreground mt-1">Acesse o painel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Usuário</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Username"
                  className="pl-9 h-10 text-sm bg-background border-border rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Senha</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="pl-9 pr-10 h-10 text-sm bg-background border-border rounded-xl"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-10 bg-foreground text-background hover:bg-foreground/90 rounded-xl text-sm font-medium" disabled={isLoading}>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              ) : (
                <>Entrar<ArrowRight className="w-4 h-4 ml-1.5" /></>
              )}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <a href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Voltar ao site</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

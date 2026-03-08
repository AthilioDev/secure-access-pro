import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background admin-bg bg-noise px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-secondary border border-border/40 mb-4">
          <Shield className="w-7 h-7 text-muted-foreground" />
        </div>
        <h1 className="text-5xl font-bold mb-2">404</h1>
        <p className="text-sm text-muted-foreground mb-6">Página não encontrada</p>
        <Button onClick={() => navigate("/")} className="bg-foreground text-background hover:bg-foreground/90 rounded-lg">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Início
        </Button>
      </div>
    </div>
  );
};

export default NotFound;

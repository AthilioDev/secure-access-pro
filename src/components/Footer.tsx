import { Shield } from "lucide-react";

const Footer = () => (
  <footer className="py-12 border-t border-border/30">
    <div className="max-w-6xl mx-auto px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Athilio Auth</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Athilio Auth. Todos os direitos reservados.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;

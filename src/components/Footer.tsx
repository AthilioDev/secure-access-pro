import { Shield } from "lucide-react";

const Footer = () => (
  <footer className="py-8 border-t border-border/20">
    <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-semibold">Athilio Auth</span>
      </div>
      <p className="text-[11px] text-muted-foreground">© {new Date().getFullYear()} Athilio Auth</p>
    </div>
  </footer>
);

export default Footer;

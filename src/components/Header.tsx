import { Shield, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Header = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5">
          <Shield className="w-6 h-6 text-foreground" />
          <span className="text-base font-bold tracking-tight">Secure Access Pro</span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          <NavLink href="#features">Recursos</NavLink>
          <NavLink href="#how">Como Funciona</NavLink>
          <NavLink href="#pricing">Planos</NavLink>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground" asChild>
            <a href="/login">Login</a>
          </Button>
          <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-5 text-sm" asChild>
            <a href="/login">Começar</a>
          </Button>
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl px-6 py-4 space-y-3"
          >
            <NavLink href="#features">Recursos</NavLink>
            <NavLink href="#how">Como Funciona</NavLink>
            <NavLink href="#pricing">Planos</NavLink>
            <Button size="sm" className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full mt-2" asChild>
              <a href="/login">Acessar Painel</a>
            </Button>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors block md:inline">
    {children}
  </a>
);

export default Header;

import { Shield, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const Header = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/70 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          <span className="text-sm font-bold tracking-tight">Athilio Auth</span>
        </a>

        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
          <a href="#how" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Como Funciona</a>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-8" asChild>
            <a href="/login">Login</a>
          </Button>
          <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 rounded-lg px-4 h-8 text-xs font-medium" asChild>
            <a href="/login">Começar</a>
          </Button>
        </div>

        <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setOpen(!open)}>
          {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/30 bg-background/95 backdrop-blur-xl px-6 py-4 space-y-3"
          >
            <a href="#features" className="text-sm text-muted-foreground block">Recursos</a>
            <a href="#how" className="text-sm text-muted-foreground block">Como Funciona</a>
            <Button size="sm" className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-lg mt-2" asChild>
              <a href="/login">Acessar Painel</a>
            </Button>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;

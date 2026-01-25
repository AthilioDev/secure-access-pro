import { motion } from "framer-motion";
import { Shield, Github, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/30"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative">
              <Shield className="w-8 h-8 text-primary" />
              <div className="absolute inset-0 blur-lg bg-primary/30" />
            </div>
            <span className="text-xl font-bold gradient-text">Auth Guard Pro</span>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <NavLink href="#features">Recursos</NavLink>
            <NavLink href="#architecture">Arquitetura</NavLink>
            <NavLink href="#docs">Documentação</NavLink>
            <NavLink href="#pricing">Preços</NavLink>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" size="sm" className="gap-2">
              <Github className="w-4 h-4" />
              GitHub
            </Button>
            <Button variant="hero" size="sm">
              Começar Agora
            </Button>
          </div>

          {/* Mobile Menu */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="md:hidden pt-4 pb-2 flex flex-col gap-4"
          >
            <NavLink href="#features">Recursos</NavLink>
            <NavLink href="#architecture">Arquitetura</NavLink>
            <NavLink href="#docs">Documentação</NavLink>
            <NavLink href="#pricing">Preços</NavLink>
            <Button variant="hero" size="sm" className="w-full mt-2">
              Começar Agora
            </Button>
          </motion.nav>
        )}
      </div>
    </motion.header>
  );
};

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm font-medium"
  >
    {children}
  </a>
);

export default Header;

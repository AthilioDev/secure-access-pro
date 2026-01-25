import { motion } from "framer-motion";
import { Server, Database, Shield, Cloud, Monitor, Lock } from "lucide-react";

const ArchitectureDiagram = () => {
  return (
    <section id="architecture" className="py-32 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
            Arquitetura
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Infraestrutura{" "}
            <span className="gradient-text">Robusta e Escalável</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Construído sobre tecnologias modernas para garantir performance, 
            segurança e disponibilidade.
          </p>
        </motion.div>

        {/* Architecture Diagram */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          <div className="glass-card p-8 md:p-12 rounded-2xl">
            <div className="grid md:grid-cols-3 gap-8 items-center">
              {/* Client Layer */}
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                    Cliente
                  </span>
                </div>
                <ArchNode icon={Monitor} label="FiveM Server" sublabel="Seu Script" />
                <ConnectionLine direction="down" />
                <ArchNode icon={Lock} label="Auth Module" sublabel="Lua Client" />
              </div>

              {/* Connection Lines */}
              <div className="hidden md:flex items-center justify-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent relative">
                  <motion.div
                    className="absolute top-1/2 left-0 w-3 h-3 rounded-full bg-primary -translate-y-1/2"
                    animate={{ x: ["0%", "100%", "0%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              </div>

              {/* Server Layer */}
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <span className="text-sm font-semibold text-accent uppercase tracking-wider">
                    Servidor
                  </span>
                </div>
                <ArchNode icon={Cloud} label="Edge Functions" sublabel="Supabase" highlighted />
                <ConnectionLine direction="down" />
                <ArchNode icon={Database} label="PostgreSQL" sublabel="Dados Seguros" highlighted />
              </div>
            </div>

            {/* Security Layer */}
            <div className="mt-12 pt-8 border-t border-border/30">
              <div className="text-center mb-6">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Camada de Segurança
                </span>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <SecurityBadge>Tokens JWT</SecurityBadge>
                <SecurityBadge>Rate Limiting</SecurityBadge>
                <SecurityBadge>HWID Validation</SecurityBadge>
                <SecurityBadge>IP Whitelisting</SecurityBadge>
                <SecurityBadge>AES-256 Encryption</SecurityBadge>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tech Stack */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground text-sm mb-6">Construído com</p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            <TechLogo name="React" />
            <TechLogo name="TypeScript" />
            <TechLogo name="Supabase" />
            <TechLogo name="Tailwind" />
            <TechLogo name="Vite" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const ArchNode = ({ 
  icon: Icon, 
  label, 
  sublabel, 
  highlighted 
}: { 
  icon: any; 
  label: string; 
  sublabel: string;
  highlighted?: boolean;
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`p-4 rounded-xl border transition-all duration-300 ${
      highlighted 
        ? "bg-primary/10 border-primary/30" 
        : "bg-secondary/30 border-border/30"
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        highlighted ? "bg-primary/20" : "bg-secondary"
      }`}>
        <Icon className={`w-5 h-5 ${highlighted ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div>
        <div className="font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{sublabel}</div>
      </div>
    </div>
  </motion.div>
);

const ConnectionLine = ({ direction }: { direction: "down" | "right" }) => (
  <div className={`flex ${direction === "down" ? "justify-center" : "items-center"}`}>
    <div className={`${
      direction === "down" 
        ? "w-px h-8" 
        : "h-px w-8"
    } bg-gradient-to-b from-border/50 via-primary/30 to-border/50`} />
  </div>
);

const SecurityBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="px-4 py-2 rounded-full text-xs font-medium bg-secondary/50 border border-border/30 text-muted-foreground">
    {children}
  </span>
);

const TechLogo = ({ name }: { name: string }) => (
  <span className="text-sm font-medium hover:text-primary transition-colors cursor-default">
    {name}
  </span>
);

export default ArchitectureDiagram;

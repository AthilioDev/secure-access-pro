import { motion } from "framer-motion";
import { Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => (
  <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
    {/* Subtle radial glow */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-foreground/[0.03] blur-[120px]" />
    </div>

    <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-card/60 mb-8"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" />
        <span className="text-xs text-muted-foreground tracking-wide">Proteção de Scripts FiveM</span>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] mb-6"
      >
        Secure<br />Access Pro
      </motion.h1>

      {/* Sub */}
      <motion.p
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed"
      >
        Sistema profissional de autenticação e licenciamento. Proteja seus scripts com segurança real.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-3"
      >
        <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-8 h-12 text-sm font-medium group" asChild>
          <a href="/login">
            Acessar Painel
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </Button>
        <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-sm border-border/60" asChild>
          <a href="#features">Ver Recursos</a>
        </Button>
      </motion.div>

      {/* Minimal stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="mt-20 flex items-center justify-center gap-12 text-center"
      >
        <Stat value="99.9%" label="Uptime" />
        <div className="w-px h-8 bg-border/50" />
        <Stat value="<50ms" label="Latência" />
        <div className="w-px h-8 bg-border/50" />
        <Stat value="AES-256" label="Criptografia" />
      </motion.div>
    </div>

    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
  </section>
);

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div>
    <div className="text-lg md:text-xl font-bold">{value}</div>
    <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
  </div>
);

export default HeroSection;

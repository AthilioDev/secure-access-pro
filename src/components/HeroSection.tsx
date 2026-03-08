import { motion } from "framer-motion";
import { ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => (
  <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-14">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-foreground/[0.02] blur-[100px]" />
    </div>

    <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-border/50 bg-card/50 mb-6"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" />
        <span className="text-[11px] text-muted-foreground">Sistema de Licenciamento</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95] mb-5"
      >
        Athilio Auth
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed"
      >
        Gerencie licenças, controle acessos e proteja seus recursos com simplicidade.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex items-center justify-center gap-3"
      >
        <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 rounded-lg px-6 h-11 text-sm font-medium group" asChild>
          <a href="/login">
            Acessar Painel
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-16 flex items-center justify-center gap-8 text-center"
      >
        {[
          { v: "99.9%", l: "Uptime" },
          { v: "<50ms", l: "Latência" },
          { v: "24/7", l: "Monitoramento" },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-8">
            {i > 0 && <div className="w-px h-6 bg-border/40" />}
            <div>
              <div className="text-base font-bold">{s.v}</div>
              <div className="text-[11px] text-muted-foreground">{s.l}</div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default HeroSection;

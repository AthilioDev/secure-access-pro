import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => (
  <section className="py-24 relative">
    <div className="max-w-5xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-lg mx-auto text-center glass-card p-10 md:p-14"
      >
        <h2 className="text-2xl md:text-4xl font-bold mb-3">Pronto para proteger?</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Acesse o painel e proteja seus scripts agora.
        </p>

        <div className="inline-flex items-baseline gap-1.5 mb-6">
          <span className="text-3xl font-black">Grátis</span>
          <span className="text-muted-foreground text-xs">/para sempre</span>
        </div>

        <div className="flex justify-center">
          <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 rounded-lg px-6 h-11 text-sm font-medium group" asChild>
            <a href="/login">
              Começar Agora
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </Button>
        </div>

        <div className="mt-6 pt-4 border-t border-border/30 flex flex-wrap items-center justify-center gap-4 text-[11px] text-muted-foreground">
          <span>✓ Setup rápido</span>
          <span>✓ Sem cartão</span>
          <span>✓ Webhooks incluídos</span>
        </div>
      </motion.div>
    </div>
  </section>
);

export default CTASection;

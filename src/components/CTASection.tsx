import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => (
  <section id="pricing" className="py-28 relative">
    <div className="max-w-6xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto text-center rounded-3xl border border-border/50 bg-card/40 p-12 md:p-16"
      >
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          Pronto para proteger?
        </h2>
        <p className="text-muted-foreground text-base mb-8 max-w-md mx-auto">
          Acesse o painel, gere suas licenças e proteja seus scripts FiveM agora mesmo.
        </p>

        <div className="inline-flex items-baseline gap-2 mb-8">
          <span className="text-4xl md:text-5xl font-black">Grátis</span>
          <span className="text-muted-foreground text-sm">/para sempre</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-8 h-12 text-sm font-medium group" asChild>
            <a href="/login">
              Começar Agora
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-border/30 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          <span>✓ Setup em minutos</span>
          <span>✓ Sem cartão de crédito</span>
          <span>✓ Webhooks incluídos</span>
        </div>
      </motion.div>
    </div>
  </section>
);

export default CTASection;

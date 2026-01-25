import { motion } from "framer-motion";
import { ArrowRight, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section id="pricing" className="py-32 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_hsl(220_20%_4%)_80%)]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          {/* Main CTA Card */}
          <div className="gradient-border rounded-3xl p-8 md:p-16 text-center">
            {/* Icon */}
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-8"
            >
              <Shield className="w-10 h-10 text-primary" />
            </motion.div>

            {/* Heading */}
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Pronto para{" "}
              <span className="gradient-text text-glow">proteger</span>
              <br />
              seus scripts?
            </h2>

            <p className="text-muted-foreground text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Junte-se a centenas de desenvolvedores que já confiam no Auth Guard Pro
              para proteger seus projetos FiveM.
            </p>

            {/* Pricing */}
            <div className="inline-flex items-baseline gap-2 mb-10">
              <span className="text-muted-foreground line-through text-lg">R$99</span>
              <span className="text-5xl md:text-6xl font-bold gradient-text">Grátis</span>
              <span className="text-muted-foreground">/para sempre</span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" className="group w-full sm:w-auto">
                <Sparkles className="w-5 h-5" />
                Começar Agora
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
                Falar com Suporte
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 pt-8 border-t border-border/30">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <TrustBadge>✓ Setup em 5 minutos</TrustBadge>
                <TrustBadge>✓ Sem cartão de crédito</TrustBadge>
                <TrustBadge>✓ Suporte 24/7</TrustBadge>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const TrustBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="flex items-center gap-2">
    {children}
  </span>
);

export default CTASection;

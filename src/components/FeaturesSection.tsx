import { motion } from "framer-motion";
import { Shield, Key, Users, Activity, Zap, Globe, Webhook, Bot } from "lucide-react";

const features = [
  { icon: Shield, title: "Proteção Total", desc: "Licenças vinculadas a IP e porta para máxima segurança." },
  { icon: Key, title: "Gestão de Licenças", desc: "Crie, edite, suspenda e revogue licenças pelo painel." },
  { icon: Users, title: "Multi-Usuário", desc: "Níveis de permissão com limites por plano." },
  { icon: Activity, title: "Logs Completos", desc: "Registros de validações e alterações do sistema." },
  { icon: Bot, title: "Bots Discord", desc: "Configure bots individuais para automação de licenças." },
  { icon: Zap, title: "Alta Performance", desc: "Validações rápidas com infraestrutura serverless." },
  { icon: Globe, title: "Automático", desc: "Validação ao iniciar, sem configuração extra." },
  { icon: Webhook, title: "Webhooks", desc: "Notificações em tempo real para Discord ou API." },
];

const FeaturesSection = () => (
  <section id="features" className="py-24 relative">
    <div className="max-w-5xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em] mb-2">Recursos</p>
        <h2 className="text-2xl md:text-4xl font-bold">Tudo para gerenciar licenças</h2>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
            className="group glass-card p-4 hover:bg-card/80 transition-all duration-200"
          >
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center mb-3 group-hover:bg-foreground/10 transition-colors">
              <f.icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <h3 className="text-sm font-semibold mb-1">{f.title}</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;

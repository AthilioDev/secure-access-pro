import { motion } from "framer-motion";
import { Shield, Key, Users, Activity, Zap, Globe, Webhook, Settings } from "lucide-react";

const features = [
  { icon: Shield, title: "Proteção Completa", desc: "Licenças vinculadas a IP e porta do servidor para máxima segurança." },
  { icon: Key, title: "Gestão de Licenças", desc: "Crie, edite, suspenda e revogue licenças em tempo real pelo painel." },
  { icon: Users, title: "Controle de Acesso", desc: "Níveis de permissão configuráveis com limites por plano." },
  { icon: Activity, title: "Logs Completos", desc: "Registros de validações, acessos e todas as alterações do sistema." },
  { icon: Settings, title: "Edição Flexível", desc: "Altere IP, porta e data de expiração das licenças a qualquer momento." },
  { icon: Zap, title: "Alta Performance", desc: "Validações rápidas com infraestrutura serverless escalável." },
  { icon: Globe, title: "Automático", desc: "Validação automática ao iniciar, sem configuração extra no servidor." },
  { icon: Webhook, title: "Webhooks", desc: "Notificações em tempo real de todos os eventos no seu Discord ou sistema." },
];

const FeaturesSection = () => (
  <section id="features" className="py-28 relative">
    <div className="max-w-6xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] mb-3">Recursos</p>
        <h2 className="text-3xl md:text-5xl font-bold">Tudo para gerenciar suas licenças</h2>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="group p-5 rounded-2xl border border-border/40 bg-card/30 hover:bg-card/60 hover:border-border transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:bg-foreground/10 transition-colors">
              <f.icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <h3 className="text-sm font-semibold mb-1.5">{f.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;

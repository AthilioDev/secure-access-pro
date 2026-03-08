import { motion } from "framer-motion";
import { Shield, Key, Users, Activity, Lock, Zap, Globe, Webhook } from "lucide-react";

const features = [
  { icon: Shield, title: "Proteção Multicamada", desc: "Validação de licença + IP + porta do servidor para máxima segurança." },
  { icon: Key, title: "Gestão de Licenças", desc: "Crie, suspenda, revogue e gerencie licenças em tempo real pelo painel." },
  { icon: Users, title: "Controle de Acesso", desc: "Níveis de permissão: Staff, Admin, Master e Master++ com limites configuráveis." },
  { icon: Activity, title: "Logs Detalhados", desc: "Registros completos de validações, acessos e alterações do sistema." },
  { icon: Lock, title: "HWID & IP Lock", desc: "Vincule licenças ao hardware e IP do cliente para evitar compartilhamento." },
  { icon: Zap, title: "Alta Performance", desc: "Validações em menos de 50ms com infraestrutura serverless escalável." },
  { icon: Globe, title: "Validação Remota", desc: "Seu script valida automaticamente ao iniciar, sem configuração extra." },
  { icon: Webhook, title: "Webhooks", desc: "Receba notificações em tempo real de cada evento no seu Discord ou sistema." },
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
        <h2 className="text-3xl md:text-5xl font-bold">
          Tudo para proteger seus scripts
        </h2>
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

import { motion } from "framer-motion";
import { Shield, Key, Users, Activity, Lock, Zap, Globe, Settings } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Proteção Avançada",
    description: "Sistema de autenticação multicamada com tokens criptografados e validação em tempo real.",
  },
  {
    icon: Key,
    title: "Gestão de Licenças",
    description: "Painel completo para criar, gerenciar e revogar licenças de forma instantânea.",
  },
  {
    icon: Users,
    title: "Controle de Usuários",
    description: "Gerencie permissões, grupos e acessos com granularidade total.",
  },
  {
    icon: Activity,
    title: "Monitoramento Live",
    description: "Acompanhe em tempo real todas as ativações e tentativas de acesso.",
  },
  {
    icon: Lock,
    title: "HWID Lock",
    description: "Vincule licenças ao hardware do cliente para máxima segurança.",
  },
  {
    icon: Zap,
    title: "Alta Performance",
    description: "Validações em menos de 50ms com cache inteligente e CDN global.",
  },
  {
    icon: Globe,
    title: "API RESTful",
    description: "Integre facilmente com qualquer sistema através da nossa API documentada.",
  },
  {
    icon: Settings,
    title: "Customizável",
    description: "Configure cada aspecto do sistema de acordo com suas necessidades.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-32 relative">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
            Recursos
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Tudo que você precisa para{" "}
            <span className="gradient-text">proteger seus scripts</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Uma suíte completa de ferramentas projetadas para desenvolvedores que
            levam segurança a sério.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <FeatureCard {...feature} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <div className="group relative p-6 rounded-xl bg-card/30 border border-border/30 hover:border-primary/30 transition-all duration-300 hover:bg-card/50">
    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    
    <div className="relative z-10">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  </div>
);

export default FeaturesSection;

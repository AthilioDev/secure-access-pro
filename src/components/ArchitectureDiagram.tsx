import { motion } from "framer-motion";

const steps = [
  { num: "01", title: "Configure", desc: "Adicione os arquivos ao resource e insira sua chave." },
  { num: "02", title: "Ative", desc: "A validação ocorre automaticamente ao iniciar o servidor." },
  { num: "03", title: "Gerencie", desc: "Controle licenças e permissões pelo painel." },
  { num: "04", title: "Monitore", desc: "Receba notificações via webhooks em tempo real." },
];

const ArchitectureDiagram = () => (
  <section id="how" className="py-24 relative">
    <div className="max-w-5xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em] mb-2">Processo</p>
        <h2 className="text-2xl md:text-4xl font-bold">Como funciona</h2>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.num}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="relative glass-card p-5"
          >
            <span className="text-4xl font-black text-foreground/[0.04] absolute top-3 right-3 select-none">{s.num}</span>
            <h3 className="text-sm font-semibold mb-1.5 relative z-10">{s.title}</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed relative z-10">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ArchitectureDiagram;

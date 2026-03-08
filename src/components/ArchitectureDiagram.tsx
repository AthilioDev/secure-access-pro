import { motion } from "framer-motion";

const steps = [
  { num: "01", title: "Instalação", desc: "Coloque os arquivos server.lua e license.json na pasta do seu resource FiveM." },
  { num: "02", title: "Configuração", desc: "Insira a chave de licença e o nome do script no arquivo license.json." },
  { num: "03", title: "Validação Automática", desc: "Ao iniciar o server, o sistema valida licença, IP e porta automaticamente." },
  { num: "04", title: "Proteção Ativa", desc: "Se válido, o script roda normalmente. Se inválido, o resource é parado." },
];

const ArchitectureDiagram = () => (
  <section id="how" className="py-28 relative">
    <div className="max-w-6xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] mb-3">Processo</p>
        <h2 className="text-3xl md:text-5xl font-bold">Como funciona</h2>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((s, i) => (
          <motion.div
            key={s.num}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative p-6 rounded-2xl border border-border/40 bg-card/30"
          >
            <span className="text-5xl font-black text-foreground/[0.06] absolute top-4 right-4 select-none">{s.num}</span>
            <div className="relative z-10">
              <h3 className="text-sm font-semibold mb-2">{s.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ArchitectureDiagram;

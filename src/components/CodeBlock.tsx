import { motion } from "framer-motion";
import { Copy, Check, Terminal } from "lucide-react";
import { useState } from "react";

const codeExample = `-- Validação de Licença (Edge Function)
const validateLicense = async (req) => {
  const { license_key, hwid } = await req.json();
  
  // Buscar licença no banco
  const { data: license } = await supabase
    .from('licenses')
    .select('*')
    .eq('key', license_key)
    .single();

  // Verificar HWID
  if (license.hwid && license.hwid !== hwid) {
    return new Response(
      JSON.stringify({ valid: false, error: 'HWID_MISMATCH' }),
      { status: 403 }
    );
  }

  // Atualizar último acesso
  await supabase
    .from('licenses')
    .update({ last_used: new Date(), hwid })
    .eq('id', license.id);

  return new Response(
    JSON.stringify({ valid: true, expires: license.expires_at }),
    { status: 200 }
  );
};`;

const luaExample = `-- Integração no seu script FiveM
local AuthGuard = {}

function AuthGuard.Validate()
    local hwid = GetPlayerIdentifiers(source)[1]
    
    PerformHttpRequest(
        "https://sua-api.supabase.co/functions/v1/validate",
        function(status, response)
            local data = json.decode(response)
            
            if data.valid then
                print("^2[AuthGuard] Licença válida!^0")
                TriggerEvent("auth:validated", data)
            else
                print("^1[AuthGuard] Licença inválida: " .. data.error .. "^0")
                -- Bloquear execução do script
            end
        end,
        "POST",
        json.encode({ license_key = Config.LicenseKey, hwid = hwid }),
        { ["Content-Type"] = "application/json" }
    )
end`;

const CodeBlock = () => {
  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
            Integração
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Fácil de{" "}
            <span className="gradient-text">Implementar</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Integre o Auth Guard Pro em minutos. Código limpo, documentado e pronto para produção.
          </p>
        </motion.div>

        {/* Code Examples */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <CodeCard title="Edge Function (TypeScript)" code={codeExample} language="typescript" />
          <CodeCard title="Client (Lua)" code={luaExample} language="lua" />
        </div>
      </div>
    </section>
  );
};

const CodeCard = ({ title, code, language }: { title: string; code: string; language: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="glass-card rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-secondary/30 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-primary/70" />
          </div>
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-mono">{title}</span>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          {copied ? (
            <Check className="w-4 h-4 text-primary" />
          ) : (
            <Copy className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Code */}
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono text-muted-foreground leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    </motion.div>
  );
};

export default CodeBlock;

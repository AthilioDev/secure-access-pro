import { useEffect, useState } from "react";
import { Shield, Download, Copy, Check, ArrowLeft, Lock, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

/* ── Templates (code is NOT shown to user, only downloaded) ── */
const LICENSE_JSON_TEMPLATE = (licenseKey: string, scriptName: string) =>
  JSON.stringify({ license_key: licenseKey, script_name: scriptName, server_port: 30120 }, null, 2);

const SERVER_LUA_TEMPLATE = (apiUrl: string) =>
  `--[[\n    Secure Access Pro - License Guard\n    DO NOT MODIFY THIS FILE\n]]\n\nlocal _0x={_u="${apiUrl}/functions/v1/verify-license",_a=false,_t=15000,_r=3,_k=nil,_s=nil,_p=nil}\nlocal function _l()local r=GetResourcePath(GetCurrentResourceName())local f=io.open(r.."/license.json","r")if not f then return nil end;local c=f:read("*a")f:close()local s,d=pcall(json.decode,c)if not s or not d then return nil end;return d end\nlocal function _v(a)a=a or 1;local i=GetConvar("web_baseUrl","")if i==""then i=GetConvar("sv_hostname","unknown")end;PerformHttpRequest(_0x._u,function(s,r)if s~=200 then if a<_0x._r then Wait(5000)_v(a+1)else StopResource(GetCurrentResourceName())end;return end;local ok,d=pcall(json.decode,r)if not ok or not d then StopResource(GetCurrentResourceName())return end;if d.valid==true then _0x._a=true;print("^2[SAP] License OK^0")else print("^1[SAP] License INVALID: "..(d.error or"UNKNOWN").."^0")StopResource(GetCurrentResourceName())end end,"POST",json.encode({license_key=_0x._k,server_ip=i,server_port=_0x._p,script_name=_0x._s}),{["Content-Type"]="application/json",["User-Agent"]="SAP/1.0"})end\nCreateThread(function()Wait(2000)local d=_l()if not d or not d.license_key or not d.script_name then print("^1[SAP] license.json missing or invalid^0")StopResource(GetCurrentResourceName())return end;_0x._k=d.license_key;_0x._s=d.script_name;_0x._p=d.server_port or 30120;_v()end)\nexports("isAuthenticated",function()return _0x._a end)`;

const Downloads = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [licenseKey, setLicenseKey] = useState("YOUR_LICENSE_KEY");
  const [scriptName, setScriptName] = useState("my-script");

  const apiUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || "nwebrckdlbjzueqehkpz"}.supabase.co`;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [isAuthenticated, authLoading, navigate]);

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Download iniciado", description: filename });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background admin-rustic">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-semibold">Downloads</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="text-xs text-muted-foreground rounded-full h-8">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Voltar
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* How it works */}
        <div className="rounded-2xl border border-border/40 bg-card/30 p-6 mb-6">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            Como Integrar
          </h2>
          <div className="grid md:grid-cols-3 gap-5 text-xs text-muted-foreground">
            <div>
              <p className="text-foreground font-medium mb-1">1. Baixe os arquivos</p>
              <p>Faça o download do <code className="bg-secondary px-1 rounded">server.lua</code> e <code className="bg-secondary px-1 rounded">license.json</code> configurados.</p>
            </div>
            <div>
              <p className="text-foreground font-medium mb-1">2. Coloque no resource</p>
              <p>Mova ambos para a pasta raiz do seu resource FiveM.</p>
            </div>
            <div>
              <p className="text-foreground font-medium mb-1">3. Inicie o server</p>
              <p>A validação ocorre automaticamente. Se inválido, o resource para.</p>
            </div>
          </div>
        </div>

        {/* Generator */}
        <div className="rounded-2xl border border-border/40 bg-card/30 p-6">
          <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-muted-foreground" />
            Gerar Arquivos
          </h2>

          <div className="grid md:grid-cols-2 gap-3 mb-5">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Chave de Licença</label>
              <Input
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="Cole a chave da licença"
                className="mt-1 h-9 text-xs bg-background border-border rounded-xl"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Nome do Script (resource)</label>
              <Input
                value={scriptName}
                onChange={(e) => setScriptName(e.target.value)}
                placeholder="Ex: meu-script"
                className="mt-1 h-9 text-xs bg-background border-border rounded-xl"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => downloadFile(SERVER_LUA_TEMPLATE(apiUrl), "server.lua")}
              className="bg-foreground text-background hover:bg-foreground/90 rounded-full text-xs h-9 px-5"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Baixar server.lua
            </Button>
            <Button
              onClick={() => downloadFile(LICENSE_JSON_TEMPLATE(licenseKey, scriptName), "license.json")}
              variant="outline"
              className="rounded-full text-xs h-9 px-5 border-border/60"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Baixar license.json
            </Button>
          </div>

          <p className="mt-4 text-[10px] text-muted-foreground/60">
            Os arquivos são gerados com o código ofuscado. Não compartilhe sua chave de licença.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Downloads;

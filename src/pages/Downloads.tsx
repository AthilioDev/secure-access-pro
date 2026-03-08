import { useEffect, useState } from "react";
import { Shield, Download, Copy, Check, ArrowLeft, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const LICENSE_JSON_TEMPLATE = (licenseKey: string, scriptName: string) =>
  JSON.stringify({ license_key: licenseKey, script_name: scriptName, server_port: 30120 }, null, 2);

const SERVER_LUA_TEMPLATE = (apiUrl: string) =>
  `--[[\n    Athilio Auth - License Guard\n    DO NOT MODIFY THIS FILE\n]]\n\nlocal _0x={_u="${apiUrl}/functions/v1/verify-license",_a=false,_t=15000,_r=3,_k=nil,_s=nil,_p=nil}\nlocal function _l()local r=GetResourcePath(GetCurrentResourceName())local f=io.open(r.."/license.json","r")if not f then return nil end;local c=f:read("*a")f:close()local s,d=pcall(json.decode,c)if not s or not d then return nil end;return d end\nlocal function _v(a)a=a or 1;local i=GetConvar("web_baseUrl","")if i==""then i=GetConvar("sv_hostname","unknown")end;PerformHttpRequest(_0x._u,function(s,r)if s~=200 then if a<_0x._r then Wait(5000)_v(a+1)else StopResource(GetCurrentResourceName())end;return end;local ok,d=pcall(json.decode,r)if not ok or not d then StopResource(GetCurrentResourceName())return end;if d.valid==true then _0x._a=true;print("^2[AA] License OK^0")else print("^1[AA] License INVALID: "..(d.error or"UNKNOWN").."^0")StopResource(GetCurrentResourceName())end end,"POST",json.encode({license_key=_0x._k,server_ip=i,server_port=_0x._p,script_name=_0x._s}),{["Content-Type"]="application/json",["User-Agent"]="AA/1.0"})end\nCreateThread(function()Wait(2000)local d=_l()if not d or not d.license_key or not d.script_name then print("^1[AA] license.json missing or invalid^0")StopResource(GetCurrentResourceName())return end;_0x._k=d.license_key;_0x._s=d.script_name;_0x._p=d.server_port or 30120;_v()end)\nexports("isAuthenticated",function()return _0x._a end)`;

const Downloads = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [licenseKey, setLicenseKey] = useState("YOUR_LICENSE_KEY");
  const [scriptName, setScriptName] = useState("my-script");
  const [copiedLua, setCopiedLua] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const apiUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || "nwebrckdlbjzueqehkpz"}.supabase.co`;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [isAuthenticated, authLoading, navigate]);

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    toast({ title: `${filename} baixado` });
  };

  const copyToClipboard = (content: string, type: 'lua' | 'json') => {
    navigator.clipboard.writeText(content);
    if (type === 'lua') { setCopiedLua(true); setTimeout(() => setCopiedLua(false), 2000); }
    else { setCopiedJson(true); setTimeout(() => setCopiedJson(false), 2000); }
    toast({ title: "Copiado!" });
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-5 h-5 border-2 border-muted-foreground/20 border-t-foreground rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background admin-bg bg-noise">
      <header className="border-b border-border/30 bg-card/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-semibold">Downloads</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="text-xs text-muted-foreground h-8">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Voltar
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Quick start */}
        <div className="glass-card p-5 mb-5">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-muted-foreground" />
            Integração Rápida
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-[11px] text-muted-foreground">
            <div><p className="text-foreground font-medium mb-0.5">1. Baixe ou copie</p><p>Obtenha o <code className="bg-secondary px-1 rounded text-[10px]">server.lua</code> e <code className="bg-secondary px-1 rounded text-[10px]">license.json</code>.</p></div>
            <div><p className="text-foreground font-medium mb-0.5">2. Coloque no resource</p><p>Mova ambos para a pasta raiz do seu resource.</p></div>
            <div><p className="text-foreground font-medium mb-0.5">3. Inicie</p><p>A validação ocorre automaticamente.</p></div>
          </div>
        </div>

        {/* Generator */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-muted-foreground" />
            Gerar Arquivos
          </h2>

          <div className="grid md:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Chave de Licença</label>
              <Input value={licenseKey} onChange={(e) => setLicenseKey(e.target.value)} className="mt-1 h-8 text-xs bg-background border-border rounded-lg" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Nome do Script</label>
              <Input value={scriptName} onChange={(e) => setScriptName(e.target.value)} className="mt-1 h-8 text-xs bg-background border-border rounded-lg" />
            </div>
          </div>

          {/* server.lua */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium">server.lua</span>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(SERVER_LUA_TEMPLATE(apiUrl), 'lua')} className="h-7 text-[10px] border-border/50">
                  {copiedLua ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copiedLua ? 'Copiado' : 'Copiar'}
                </Button>
                <Button size="sm" onClick={() => downloadFile(SERVER_LUA_TEMPLATE(apiUrl), "server.lua")} className="h-7 text-[10px] bg-foreground text-background hover:bg-foreground/90">
                  <Download className="w-3 h-3 mr-1" /> Baixar
                </Button>
              </div>
            </div>
          </div>

          {/* license.json */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium">license.json</span>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(LICENSE_JSON_TEMPLATE(licenseKey, scriptName), 'json')} className="h-7 text-[10px] border-border/50">
                  {copiedJson ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copiedJson ? 'Copiado' : 'Copiar'}
                </Button>
                <Button size="sm" onClick={() => downloadFile(LICENSE_JSON_TEMPLATE(licenseKey, scriptName), "license.json")} className="h-7 text-[10px] bg-foreground text-background hover:bg-foreground/90">
                  <Download className="w-3 h-3 mr-1" /> Baixar
                </Button>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground/50 mt-2">Não compartilhe sua chave de licença.</p>
        </div>
      </main>
    </div>
  );
};

export default Downloads;

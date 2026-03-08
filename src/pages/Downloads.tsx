import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Download, Copy, Check, FileCode, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const LICENSE_JSON_TEMPLATE = (licenseKey: string, scriptName: string) => JSON.stringify({
  license_key: licenseKey,
  script_name: scriptName,
  server_port: 30120
}, null, 2);

const SERVER_LUA_TEMPLATE = (apiUrl: string) => `--[[
    ╔═══════════════════════════════════════════════╗
    ║          Athilio Auth - License Guard          ║
    ║        Secure License Verification System      ║
    ║                                                ║
    ║  DO NOT MODIFY THIS FILE                       ║
    ║  Tampering will invalidate your license.       ║
    ╚═══════════════════════════════════════════════╝
]]--

local _0x = {
    _u = "${apiUrl}/functions/v1/verify-license",
    _auth = false,
    _timeout = 15000,
    _retries = 3,
    _k = nil,
    _s = nil,
    _p = nil
}

-- IP Whitelist (optional - leave empty to skip IP check)
local _allowedIPs = {
    -- "1.1.1.1",
    -- "192.168.1.1",
}

-- ============================================
--  Read license.json
-- ============================================
local function _loadLicense()
    local resourcePath = GetResourcePath(GetCurrentResourceName())
    local filePath = resourcePath .. "/license.json"

    local file = io.open(filePath, "r")
    if not file then
        return nil, "license.json not found in resource folder"
    end

    local content = file:read("*a")
    file:close()

    if not content or content == "" then
        return nil, "license.json is empty"
    end

    local success, data = pcall(json.decode, content)
    if not success or not data then
        return nil, "license.json has invalid JSON format"
    end

    if not data.license_key or data.license_key == "" then
        return nil, "license.json is missing 'license_key'"
    end

    if not data.script_name or data.script_name == "" then
        return nil, "license.json is missing 'script_name'"
    end

    return data, nil
end

local function _log(level, msg)
    if level == "success" then
        print("^2[Athilio Auth] " .. msg .. "^0")
    elseif level == "error" then
        print("^1[Athilio Auth] " .. msg .. "^0")
    elseif level == "warn" then
        print("^3[Athilio Auth] " .. msg .. "^0")
    else
        print("^5[Athilio Auth] " .. msg .. "^0")
    end
end

local function _checkIPWhitelist(ip)
    if #_allowedIPs == 0 then return true end
    for _, allowedIP in ipairs(_allowedIPs) do
        if allowedIP == ip then
            return true
        end
    end
    return false
end

local function _stopResource()
    _log("error", "LICENSE VALIDATION FAILED - Stopping resource...")
    Wait(3000)
    local resourceName = GetCurrentResourceName()
    _log("error", "Resource '" .. resourceName .. "' will be stopped.")
    StopResource(resourceName)
end

local function _validate(attempt)
    attempt = attempt or 1
    _log("info", "Validating license... (attempt " .. attempt .. "/" .. _0x._retries .. ")")

    -- Get server IP
    local serverIP = GetConvar("web_baseUrl", "")
    if serverIP == "" then
        serverIP = GetConvar("sv_hostname", "unknown")
    end

    -- Check local IP whitelist first
    if not _checkIPWhitelist(serverIP) then
        _log("error", "Server IP not in whitelist: " .. serverIP)
        _stopResource()
        return
    end

    local payload = json.encode({
        license_key = _0x._k,
        server_ip = serverIP,
        server_port = _0x._p,
        script_name = _0x._s
    })

    PerformHttpRequest(_0x._u, function(statusCode, responseText, headers)
        -- Handle network errors
        if statusCode == 0 or statusCode == nil then
            _log("warn", "Network error - could not reach auth server")
            if attempt < _0x._retries then
                _log("info", "Retrying in 5 seconds...")
                Wait(5000)
                _validate(attempt + 1)
            else
                _log("error", "Failed to connect after " .. _0x._retries .. " attempts")
                _stopResource()
            end
            return
        end

        -- Handle HTTP errors
        if statusCode ~= 200 then
            _log("error", "Auth server returned status: " .. tostring(statusCode))
            if attempt < _0x._retries then
                Wait(5000)
                _validate(attempt + 1)
            else
                _stopResource()
            end
            return
        end

        -- Parse response
        local success, data = pcall(json.decode, responseText)
        if not success or not data then
            _log("error", "Invalid response from auth server")
            _stopResource()
            return
        end

        -- Check validation result
        if data.valid == true then
            _0x._auth = true
            _log("success", "==========================================")
            _log("success", "  License validated successfully!")
            if data.owner then
                _log("success", "  Owner: " .. data.owner)
            end
            _log("success", "  Script: " .. _0x._s)
            _log("success", "==========================================")
        else
            local reason = data.error or "UNKNOWN"
            if data.expired then
                _log("error", "==========================================")
                _log("error", "  License EXPIRED")
                _log("error", "  Owner: " .. (data.owner or "Unknown"))
                _log("error", "  Please renew your license.")
                _log("error", "==========================================")
            else
                _log("error", "==========================================")
                _log("error", "  License INVALID")
                _log("error", "  Reason: " .. reason)
                _log("error", "==========================================")
            end
            _stopResource()
        end
    end, "POST", payload, {
        ["Content-Type"] = "application/json",
        ["User-Agent"] = "AthilioAuth/1.0"
    })
end

-- Run validation on resource start
CreateThread(function()
    Wait(2000) -- Wait for server to be ready

    -- Load license from license.json
    local licenseData, err = _loadLicense()
    if not licenseData then
        _log("error", "Failed to load license: " .. (err or "unknown error"))
        _log("error", "Make sure license.json exists in the resource folder with:")
        _log("error", '  { "license_key": "YOUR_KEY", "script_name": "your-script" }')
        _stopResource()
        return
    end

    _0x._k = licenseData.license_key
    _0x._s = licenseData.script_name
    _0x._p = licenseData.server_port or 30120

    _log("info", "Loaded license for script: " .. _0x._s)
    _validate()
end)

-- Export auth status for other scripts
exports("isAuthenticated", function()
    return _0x._auth
end)
`;

const Downloads = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [licenseKey, setLicenseKey] = useState("YOUR_LICENSE_KEY");
  const [scriptName, setScriptName] = useState("my-script");

  const apiUrl = `https://nwebrckdlbjzueqehkpz.supabase.co`;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const generatedCode = SERVER_LUA_TEMPLATE(apiUrl);
  const generatedLicenseJson = LICENSE_JSON_TEMPLATE(licenseKey, scriptName);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copiado!", description: "Código copiado para a área de transferência" });
  };

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
  };

  const handleDownloadLua = () => {
    downloadFile(generatedCode, "server.lua");
    toast({ title: "Download iniciado!", description: "server.lua" });
  };

  const handleDownloadLicense = () => {
    downloadFile(generatedLicenseJson, "license.json");
    toast({ title: "Download iniciado!", description: "license.json" });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold gradient-text">Athilio Auth</h1>
                <p className="text-xs text-muted-foreground">Integração & Downloads</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Painel
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-5xl">
        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 rounded-xl mb-8"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Lock className="w-6 h-6" />
            Como Funciona
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div className="space-y-2">
              <div className="text-foreground font-semibold">1. Configuração</div>
              <p>Coloque <code className="text-primary bg-secondary/50 px-1 rounded">server.lua</code> e <code className="text-primary bg-secondary/50 px-1 rounded">license.json</code> na pasta do seu resource FiveM.</p>
            </div>
            <div className="space-y-2">
              <div className="text-foreground font-semibold">2. Verificação</div>
              <p>Quando o server iniciar, o <code className="text-primary bg-secondary/50 px-1 rounded">server.lua</code> lê o <code className="text-primary bg-secondary/50 px-1 rounded">license.json</code> e faz uma requisição HTTP para a API.</p>
            </div>
            <div className="space-y-2">
              <div className="text-foreground font-semibold">3. Resultado</div>
              <p>Se válida, o script roda normalmente. Se inválida ou expirada, o resource é parado automaticamente.</p>
            </div>
          </div>
        </motion.div>

        {/* Generator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 rounded-xl mb-8"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <FileCode className="w-6 h-6" />
            Gerar server.lua
          </h2>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-1 block">Chave de Licença</label>
              <Input
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="Cole a chave da licença"
                className="bg-secondary/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Nome do Script (resource)</label>
              <Input
                value={scriptName}
                onChange={(e) => setScriptName(e.target.value)}
                placeholder="Ex: meu-script"
                className="bg-secondary/30"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <Button variant="outline" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copiado!" : "Copiar server.lua"}
            </Button>
            <Button onClick={handleDownloadLua} className="bg-foreground text-background hover:bg-foreground/90">
              <Download className="w-4 h-4 mr-2" />
              Baixar server.lua
            </Button>
            <Button onClick={handleDownloadLicense} className="bg-foreground text-background hover:bg-foreground/90">
              <Download className="w-4 h-4 mr-2" />
              Baixar license.json
            </Button>
          </div>

          {/* Code preview */}
          <div className="rounded-lg overflow-hidden border border-border/30">
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 border-b border-border/30">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-primary/70" />
              </div>
              <span className="text-xs text-muted-foreground font-mono">server.lua</span>
            </div>
            <div className="p-4 overflow-x-auto max-h-96 overflow-y-auto bg-background/50">
              <pre className="text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre">
                {generatedCode}
              </pre>
            </div>
          </div>
        </motion.div>

        {/* API docs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-8 rounded-xl"
        >
          <h2 className="text-2xl font-bold mb-6">Documentação da API</h2>
          
          <div className="space-y-6 text-sm">
            <div>
              <h3 className="text-foreground font-semibold mb-2">Endpoint</h3>
              <code className="block bg-secondary/50 px-4 py-2 rounded text-muted-foreground font-mono text-xs">
                POST {apiUrl}/functions/v1/verify-license
              </code>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2">Request Body</h3>
              <pre className="bg-secondary/50 px-4 py-3 rounded text-muted-foreground font-mono text-xs">
{`{
  "license_key": "XXXX-XXXX-XXXX-XXXX",
  "server_ip": "1.2.3.4",
  "script_name": "my-resource"
}`}
              </pre>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2">Response (Success)</h3>
              <pre className="bg-secondary/50 px-4 py-3 rounded text-muted-foreground font-mono text-xs">
{`{
  "valid": true,
  "expired": false,
  "owner": "Client Name"
}`}
              </pre>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2">Response (Failure)</h3>
              <pre className="bg-secondary/50 px-4 py-3 rounded text-muted-foreground font-mono text-xs">
{`{
  "valid": false,
  "expired": true,
  "owner": "Client Name",
  "error": "LICENSE_EXPIRED"
}`}
              </pre>
            </div>

            <div>
              <h3 className="text-foreground font-semibold mb-2">Possible Errors</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><code className="text-primary">LICENSE_NOT_FOUND</code> — Licença não existe no sistema</li>
                <li><code className="text-primary">LICENSE_EXPIRED</code> — Licença expirada</li>
                <li><code className="text-primary">LICENSE_SUSPENDED</code> — Licença suspensa pelo admin</li>
                <li><code className="text-primary">LICENSE_REVOKED</code> — Licença revogada</li>
                <li><code className="text-primary">IP_MISMATCH</code> — IP do servidor não corresponde ao registrado</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Downloads;
import { motion } from "framer-motion";
import { Folder, FolderOpen, FileCode, FileJson, File, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";

interface TreeNode {
  name: string;
  type: "folder" | "file";
  children?: TreeNode[];
  extension?: string;
}

const projectStructure: TreeNode = {
  name: "auth-guard-pro",
  type: "folder",
  children: [
    {
      name: "src",
      type: "folder",
      children: [
        {
          name: "components",
          type: "folder",
          children: [
            { name: "ArchitectureDiagram.tsx", type: "file", extension: "tsx" },
            { name: "CodeBlock.tsx", type: "file", extension: "tsx" },
            { name: "FileTree.tsx", type: "file", extension: "tsx" },
            { name: "Header.tsx", type: "file", extension: "tsx" },
          ],
        },
        {
          name: "pages",
          type: "folder",
          children: [
            { name: "Index.tsx", type: "file", extension: "tsx" },
            { name: "Login.tsx", type: "file", extension: "tsx" },
            { name: "Admin.tsx", type: "file", extension: "tsx" },
          ],
        },
        {
          name: "lib",
          type: "folder",
          children: [
            { name: "supabase.ts", type: "file", extension: "ts" },
            { name: "utils.ts", type: "file", extension: "ts" },
          ],
        },
        { name: "App.tsx", type: "file", extension: "tsx" },
        { name: "main.tsx", type: "file", extension: "tsx" },
      ],
    },
    {
      name: "supabase",
      type: "folder",
      children: [
        {
          name: "functions",
          type: "folder",
          children: [
            { name: "validate-license", type: "folder", children: [{ name: "index.ts", type: "file", extension: "ts" }] },
            { name: "create-license", type: "folder", children: [{ name: "index.ts", type: "file", extension: "ts" }] },
          ],
        },
        {
          name: "migrations",
          type: "folder",
          children: [
            { name: "001_initial.sql", type: "file", extension: "sql" },
          ],
        },
        { name: "config.toml", type: "file", extension: "toml" },
      ],
    },
    { name: "package.json", type: "file", extension: "json" },
    { name: "tailwind.config.ts", type: "file", extension: "ts" },
    { name: "vite.config.ts", type: "file", extension: "ts" },
  ],
};

const FileTree = () => {
  return (
    <section id="docs" className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
              Estrutura do Projeto
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Código{" "}
              <span className="gradient-text">Organizado</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Arquitetura modular e bem documentada. Cada componente tem uma responsabilidade 
              clara, facilitando manutenção e extensão.
            </p>

            <div className="space-y-4">
              <FeatureItem>Componentes React reutilizáveis</FeatureItem>
              <FeatureItem>Edge Functions serverless</FeatureItem>
              <FeatureItem>Migrações SQL versionadas</FeatureItem>
              <FeatureItem>TypeScript para type-safety</FeatureItem>
            </div>
          </motion.div>

          {/* Right - File Tree */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="glass-card rounded-xl overflow-hidden">
              {/* Terminal Header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-secondary/30 border-b border-border/30">
                <div className="w-3 h-3 rounded-full bg-destructive/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-primary/70" />
                <span className="ml-3 text-xs text-muted-foreground font-mono">estrutura do projeto</span>
              </div>

              {/* Tree Content */}
              <div className="p-4 font-mono text-sm max-h-[500px] overflow-y-auto">
                <TreeNodeComponent node={projectStructure} depth={0} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const TreeNodeComponent = ({ node, depth }: { node: TreeNode; depth: number }) => {
  const [isOpen, setIsOpen] = useState(depth < 2);

  const getFileIcon = (extension?: string) => {
    switch (extension) {
      case "tsx":
      case "ts":
        return <FileCode className="w-4 h-4 text-blue-400" />;
      case "json":
        return <FileJson className="w-4 h-4 text-yellow-400" />;
      case "sql":
        return <FileCode className="w-4 h-4 text-orange-400" />;
      default:
        return <File className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (node.type === "file") {
    return (
      <div 
        className="flex items-center gap-2 py-1 px-2 rounded hover:bg-secondary/30 transition-colors cursor-default"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {getFileIcon(node.extension)}
        <span className="text-muted-foreground hover:text-foreground transition-colors">
          {node.name}
        </span>
      </div>
    );
  }

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1 px-2 rounded hover:bg-secondary/30 transition-colors cursor-pointer"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
        {isOpen ? (
          <FolderOpen className="w-4 h-4 text-primary" />
        ) : (
          <Folder className="w-4 h-4 text-primary" />
        )}
        <span className="text-foreground font-medium">{node.name}</span>
      </div>
      {isOpen && node.children && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          {node.children.map((child, index) => (
            <TreeNodeComponent key={index} node={child} depth={depth + 1} />
          ))}
        </motion.div>
      )}
    </div>
  );
};

const FeatureItem = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3">
    <div className="w-2 h-2 rounded-full bg-primary" />
    <span className="text-muted-foreground">{children}</span>
  </div>
);

export default FileTree;

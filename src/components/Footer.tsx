import { Shield, Github, Twitter, MessageCircle, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-16 border-t border-border/30">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-7 h-7 text-primary" />
              <span className="text-lg font-bold gradient-text">Auth Guard Pro</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Sistema profissional de autenticação e licenciamento para FiveM.
            </p>
            <div className="flex items-center gap-3">
              <SocialLink href="#" icon={Github} />
              <SocialLink href="#" icon={Twitter} />
              <SocialLink href="#" icon={MessageCircle} />
              <SocialLink href="#" icon={Mail} />
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Produto</h4>
            <ul className="space-y-3">
              <FooterLink href="#features">Recursos</FooterLink>
              <FooterLink href="#architecture">Arquitetura</FooterLink>
              <FooterLink href="#pricing">Preços</FooterLink>
              <FooterLink href="#">Changelog</FooterLink>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Recursos</h4>
            <ul className="space-y-3">
              <FooterLink href="#docs">Documentação</FooterLink>
              <FooterLink href="#">API Reference</FooterLink>
              <FooterLink href="#">Guias</FooterLink>
              <FooterLink href="#">Exemplos</FooterLink>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Suporte</h4>
            <ul className="space-y-3">
              <FooterLink href="#">Discord</FooterLink>
              <FooterLink href="#">GitHub Issues</FooterLink>
              <FooterLink href="#">FAQ</FooterLink>
              <FooterLink href="#">Contato</FooterLink>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 Auth Guard Pro. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Termos de Uso
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacidade
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialLink = ({ href, icon: Icon }: { href: string; icon: any }) => (
  <a
    href={href}
    className="w-9 h-9 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary transition-all duration-200"
  >
    <Icon className="w-4 h-4" />
  </a>
);

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <li>
    <a
      href={href}
      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
    >
      {children}
    </a>
  </li>
);

export default Footer;

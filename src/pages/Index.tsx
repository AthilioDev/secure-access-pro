import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";
import FileTree from "@/components/FileTree";
import CodeBlock from "@/components/CodeBlock";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ArchitectureDiagram />
        <FileTree />
        <CodeBlock />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

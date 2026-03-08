import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen bg-background bg-noise">
    <Header />
    <main>
      <HeroSection />
      <FeaturesSection />
      <ArchitectureDiagram />
      <CTASection />
    </main>
    <Footer />
  </div>
);

export default Index;

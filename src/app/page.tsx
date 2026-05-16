import { ArchitectureStrip } from "@/components/landing/architecture-strip";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { HeroSection } from "@/components/landing/hero-section";
import { PortalShowcase } from "@/components/landing/portal-showcase";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeatureGrid />
      <PortalShowcase />
      <ArchitectureStrip />
    </>
  );
}

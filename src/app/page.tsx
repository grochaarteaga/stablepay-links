import Nav from "@/components/marketing/Nav";
import Hero from "@/components/marketing/Hero";
import LogoStrip from "@/components/marketing/LogoStrip";
import ProblemStats from "@/components/marketing/ProblemStats";
import HowItWorks from "@/components/marketing/HowItWorks";
import ForPortAgents from "@/components/marketing/ForPortAgents";
import ForShippingCompanies from "@/components/marketing/ForShippingCompanies";
import InfrastructureTrust from "@/components/marketing/InfrastructureTrust";
import SocialProof from "@/components/marketing/SocialProof";
import PricingTeaser from "@/components/marketing/PricingTeaser";
import FAQ from "@/components/marketing/FAQ";
import FinalCTA from "@/components/marketing/FinalCTA";
import Footer from "@/components/marketing/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <LogoStrip />
        <ProblemStats />
        <HowItWorks />
        <ForPortAgents />
        <ForShippingCompanies />
        <InfrastructureTrust />
        <SocialProof />
        <PricingTeaser />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}

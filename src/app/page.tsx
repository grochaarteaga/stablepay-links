// src/app/page.tsx
// Marketing landing page. Composed of section components under
// src/components/marketing/. Each section is its own file for isolated edits.

import Nav from "@/components/marketing/Nav";
import Hero from "@/components/marketing/Hero";
import Footer from "@/components/marketing/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />

        {/* TODO: LogoStrip — Section 3
            Label: "Built on enterprise-grade rails"
            Logos: Bridge · Coinbase · Base · Circle · Privy
            File: src/components/marketing/LogoStrip.tsx */}

        {/* TODO: ProblemStats — Section 4
            Headline: "The maritime industry still moves money like it's 1995."
            Stats: 3–15 days / $30–50 / 0 visibility
            File: src/components/marketing/ProblemStats.tsx */}

        {/* TODO: HowItWorks — Section 5
            4-step horizontal flow: invoice → send → pay → reconcile
            File: src/components/marketing/HowItWorks.tsx */}

        {/* TODO: ForPortAgents — Section 6
            Headline: "Stop being your customer's bank."
            Two-column with mock UI
            File: src/components/marketing/ForPortAgents.tsx */}

        {/* TODO: ForShippingCompanies — Section 7
            Headline: "One way to pay every port, everywhere."
            File: src/components/marketing/ForShippingCompanies.tsx */}

        {/* TODO: InfrastructureTrust — Section 8
            Four trust cards (regulated partners, KYC/KYB, 1:1 USD, audit trail)
            File: src/components/marketing/InfrastructureTrust.tsx */}

        {/* TODO: SocialProof — Section 9
            Currently: onboarding message. Later: testimonials.
            File: src/components/marketing/SocialProof.tsx */}

        {/* TODO: PricingTeaser — Section 10
            "Priced for operations, not for banks."
            File: src/components/marketing/PricingTeaser.tsx */}

        {/* TODO: FAQ — Section 11
            6–8 accordion items. Never say "crypto" in answers.
            File: src/components/marketing/FAQ.tsx */}

        {/* TODO: FinalCTA — Section 12
            "Get paid faster. Starting today."
            File: src/components/marketing/FinalCTA.tsx */}
      </main>
      <Footer />
    </>
  );
}

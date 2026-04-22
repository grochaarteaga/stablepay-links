import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";

export default function LegalPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-slate-950 py-24">
        <div className="mx-auto max-w-3xl px-6">

          {/* Header */}
          <div className="mb-16">
            <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
              Legal
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
              Terms, privacy &amp; regulatory notice
            </h1>
            <p className="mt-4 text-slate-400">
              Last updated: April 2026
            </p>
          </div>

          <div className="space-y-16 text-sm text-slate-400 leading-relaxed">

            {/* Terms of Use */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-6">Terms of use</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">1. Acceptance</h3>
                  <p>By accessing or using PortPagos (the &quot;Platform&quot;), you agree to be bound by these Terms. If you do not agree, do not use the Platform. PortPagos is operated by PortPagos and is intended for business use only.</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">2. Eligibility</h3>
                  <p>The Platform is available to businesses and individuals who have completed our Know Your Business (KYB) or Know Your Customer (KYC) verification process. You must be of legal age in your jurisdiction and have the authority to bind the legal entity you represent. We currently serve businesses registered in the European Union and Latin America.</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">3. Services</h3>
                  <p>PortPagos provides an orchestration layer for business-to-business payments using USD-backed stablecoin infrastructure. We facilitate the creation of payment links, invoice management, and settlement via licensed financial partners. PortPagos does not itself hold money transmission licenses and does not custody funds. All financial activity is processed by regulated third-party partners including Bridge and Circle.</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">4. Prohibited use</h3>
                  <p>You may not use the Platform for any unlawful purpose, including but not limited to money laundering, terrorism financing, sanctions evasion, or fraud. You may not use the Platform to process payments for prohibited goods or services. We reserve the right to suspend accounts that violate these terms without prior notice.</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">5. Fees</h3>
                  <p>PortPagos charges a 0.5% fee per settled transaction. Fees are deducted from the settled amount. No setup fees, monthly fees, or minimum volume commitments apply unless separately agreed in writing.</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">6. Liability limitation</h3>
                  <p>To the maximum extent permitted by law, PortPagos is not liable for any indirect, incidental, or consequential damages arising from use of the Platform, including delays or failures caused by third-party infrastructure providers, blockchain network conditions, or regulatory actions. Our total liability for any claim shall not exceed the fees paid by you in the three months preceding the claim.</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">7. Modifications</h3>
                  <p>We may update these Terms at any time. Continued use of the Platform after changes constitutes acceptance. Material changes will be communicated via email to the address on your account.</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">8. Governing law</h3>
                  <p>These Terms are governed by the laws of the Republic of Ireland, without regard to conflict of law principles. Any disputes shall be subject to the exclusive jurisdiction of the courts of Ireland.</p>
                </div>
              </div>
            </section>

            <div className="border-t border-slate-800" />

            {/* Privacy Policy */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-6">Privacy policy</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">Data we collect</h3>
                  <p>We collect information you provide during onboarding (name, email, business details), information required for KYB/KYC compliance, transaction data generated through your use of the Platform, and technical data such as IP addresses and browser metadata for security purposes.</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">How we use your data</h3>
                  <p>Your data is used to operate the Platform, process payments, comply with legal and regulatory obligations (including AML and sanctions screening), prevent fraud, and communicate with you about your account. We do not sell your data to third parties.</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">Data sharing</h3>
                  <p>We share data with our regulated financial partners (Bridge, Circle) as necessary to process transactions. We may share data with law enforcement or regulators when legally required. All third-party partners are bound by data processing agreements and applicable data protection law.</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">Your rights (GDPR)</h3>
                  <p>If you are located in the European Economic Area, you have the right to access, correct, or delete your personal data, object to or restrict processing, and request data portability. To exercise these rights, contact us at{" "}
                    <a href="mailto:guillermo@portpagos.com" className="text-green-400 hover:text-green-300 transition">guillermo@portpagos.com</a>.
                    Note that certain data must be retained to comply with financial regulations and cannot be deleted on request.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">Retention</h3>
                  <p>Transaction records and KYB/KYC data are retained for a minimum of 5 years in accordance with AML regulations. Account data is retained for the duration of your relationship with PortPagos and for 5 years thereafter.</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">Cookies</h3>
                  <p>We use only essential cookies required for authentication and session management. We do not use tracking or advertising cookies.</p>
                </div>
              </div>
            </section>

            <div className="border-t border-slate-800" />

            {/* Regulatory notice */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-6">Regulatory notice</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">Nature of service</h3>
                  <p>PortPagos is a payment orchestration platform. We do not hold a money transmission licence and do not custody client funds. All regulated financial activity — including money transmission, conversion, and custody — is performed by our licensed partners: Bridge (money services) and Circle (USDC issuance).</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">Stablecoin notice</h3>
                  <p>USDC is a USD-denominated stablecoin issued by Circle Internet Financial, LLC. It is not a bank deposit and is not covered by deposit insurance schemes such as FDIC or EU deposit guarantee schemes. Circle maintains reserves backing USDC 1:1 in segregated accounts, independently attested monthly by a Big Four accounting firm. PortPagos makes no representation as to the future value or regulatory classification of USDC.</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">AML & sanctions</h3>
                  <p>PortPagos and its partners comply with applicable anti-money laundering (AML) laws and screen all users and transactions against sanctions lists including OFAC, EU, and UN. Accounts identified as high-risk may be restricted or reported to relevant authorities without prior notice.</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">No financial advice</h3>
                  <p>Nothing on the Platform constitutes financial, investment, legal, or tax advice. You are solely responsible for determining the legal and regulatory requirements that apply to your use of the Platform in your jurisdiction.</p>
                </div>
              </div>
            </section>

            <div className="border-t border-slate-800" />

            {/* Contact */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Contact</h2>
              <p>
                For legal enquiries, data requests, or compliance questions, contact us at{" "}
                <a href="mailto:guillermo@portpagos.com" className="text-green-400 hover:text-green-300 transition">
                  guillermo@portpagos.com
                </a>.
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

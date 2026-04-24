const steps = [
  {
    number: "01",
    title: "Create an invoice",
    desc: "Enter the amount and your customer's name. Takes 30 seconds.",
    detail: "No bank details needed. No SWIFT codes. Just an amount.",
  },
  {
    number: "02",
    title: "Send the payment link",
    desc: "Copy the link and send it via email, WhatsApp, or any channel.",
    detail: "Your customer sees a clean payment page — no account required.",
  },
  {
    number: "03",
    title: "Customer pays instantly",
    desc: "They pay in digital dollars (USD) directly from their account.",
    detail: "No FX conversion, no correspondent banks, no delays.",
  },
  {
    number: "04",
    title: "Funds settle in minutes",
    desc: "Money arrives in your PortPagos balance within 2 minutes.",
    detail: "Withdraw to your bank account whenever you want.",
  },
];

export default function HowItWorks() {
  return (
    <section id="product" className="border-b border-slate-800 bg-slate-950 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
          How it works
        </p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
          From invoice to settled — in four steps.
        </h2>
        <p className="mt-4 max-w-xl text-slate-400">
          No integration required. No crypto wallets for your customers. No
          changes to how you run your operation.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.number} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="absolute left-full top-5 hidden h-px w-8 bg-slate-800 lg:block" />
              )}
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600/10 border border-green-600/20">
                <span className="text-xs font-bold text-green-400">{step.number}</span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{step.desc}</p>
              <p className="mt-2 text-xs text-slate-600">{step.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

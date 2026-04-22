"use client";

import { useState } from "react";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";

const volumeOptions = [
  "Less than $10,000",
  "$10,000 – $50,000",
  "$50,000 – $250,000",
  "$250,000 – $1,000,000",
  "More than $1,000,000",
];

type State = "idle" | "loading" | "success" | "error";

export default function ContactPage() {
  const [state, setState] = useState<State>("idle");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    website: "",
    entityType: "",
    monthlyVolume: "",
    useCase: "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setState("success");
    } catch {
      setState("error");
    }
  }

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-slate-950 py-24">
        <div className="mx-auto max-w-2xl px-6">
          {state === "success" ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-8 py-16 text-center">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-green-600/10">
                <svg className="h-7 w-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-white">We&apos;ll be in touch.</h2>
              <p className="mt-3 text-slate-400">
                Thanks for reaching out. One of our team members will contact you within one business day.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
                  Book a demo
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
                  Let&apos;s talk about your operations.
                </h1>
                <p className="mt-4 text-slate-400">
                  Tell us a bit about your business and we&apos;ll schedule a tailored walkthrough.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      First name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.firstName}
                      onChange={(e) => set("firstName", e.target.value)}
                      placeholder="María"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Last name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.lastName}
                      onChange={(e) => set("lastName", e.target.value)}
                      placeholder="González"
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Email address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@company.com"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Company website <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={form.website}
                    onChange={(e) => set("website", e.target.value)}
                    placeholder="https://your-company.com"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-slate-300">
                    Do you represent a company or are you an individual? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    {["Company", "Individual"].map((option) => (
                      <label
                        key={option}
                        className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium transition ${
                          form.entityType === option
                            ? "border-green-600 bg-green-600/10 text-green-400"
                            : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600"
                        }`}
                      >
                        <input
                          type="radio"
                          name="entityType"
                          value={option}
                          required
                          className="sr-only"
                          onChange={() => set("entityType", option)}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    How much monthly volume are you moving today? <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={form.monthlyVolume}
                    onChange={(e) => set("monthlyVolume", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
                  >
                    <option value="" disabled>Select a range</option>
                    {volumeOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Describe your use case <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.useCase}
                    onChange={(e) => set("useCase", e.target.value)}
                    placeholder="We are a port agency that handles disbursements for vessel calls. We currently receive payments via SWIFT wire from shipping companies and typically wait 10–15 days for funds to arrive…"
                    className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
                  />
                </div>

                {state === "error" && (
                  <p className="rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                    Something went wrong. Please try again or email us directly at{" "}
                    <a href="mailto:hello@portpagos.com" className="underline">hello@portpagos.com</a>.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="w-full rounded-lg bg-green-600 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-green-500 disabled:opacity-60"
                >
                  {state === "loading" ? "Sending…" : "Book a demo →"}
                </button>

                <p className="text-center text-xs text-slate-600">
                  We respond within one business day.
                </p>
              </form>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

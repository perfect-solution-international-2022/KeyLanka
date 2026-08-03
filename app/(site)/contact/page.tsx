"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      await api.sendContact({ name, email, message });
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="container-page py-14 grid md:grid-cols-2 gap-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h1>
        <p className="text-gray-600 leading-relaxed mb-6">
          Have a question about a product, service, or bulk order? Send us a message and our team will get back to
          you shortly.
        </p>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="font-semibold text-gray-900">Key Lanka</div>
          <div>No 620 High Level Road, Wijerama, Nugegoda</div>
          <div>Land: <a href="tel:+94112812789" className="text-brand hover:underline">011 2 812 789</a></div>
          <div>Mobile: <a href="tel:+94765662666" className="text-brand hover:underline">076 5 662 666</a></div>
          <div>Mobile: <a href="tel:+94777777678" className="text-brand hover:underline">077 7 777 678</a></div>
          <div><a href="mailto:info@keylanka.lk" className="text-brand hover:underline">info@keylanka.lk</a></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 border border-gray-200 rounded-lg p-6 h-fit">
        {status === "sent" && <p className="text-sm text-green-600">Message sent — we&apos;ll be in touch soon.</p>}
        {status === "error" && <p className="text-sm text-red-600">Something went wrong. Please try again.</p>}
        <div>
          <label className="block text-sm text-gray-700 mb-1">Name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Message</label>
          <textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        </div>
        <button disabled={status === "sending"} className="w-full bg-brand hover:bg-brand-dark text-white font-medium py-2.5 rounded-md">
          {status === "sending" ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
}

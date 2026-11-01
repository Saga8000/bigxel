import { Building2, Clock, Headphones, Lock, Mail, MapPin, MessageCircle, MessageSquare, Phone, Rocket, Send, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import FaqItem from "../../components/Faq";
import { CtaBanner } from "../../components/sections";
import { Alert, Field, SelectField, SubmitButton, TextAreaField } from "../../components/ui";
import { site } from "../../content/site";
import { api, ApiError } from "../../lib/api";

const TOPICS = ["General enquiry", "Advertising", "Listing a screen", "Pricing", "Technical support", "Partnership"];

const faqs = [
  { q: "How can I list my screen on BigXel Ads?", a: "Create a free screen owner account, add your screen's details and photo, and submit it for review. Once our team approves it, advertisers can book it." },
  { q: "Is there a fee to list my screen?", a: "No. Listing a screen is free. The platform keeps a commission from each booking you approve." },
  { q: "How do advertisers book ads on screens?", a: "Advertisers browse screens, choose dates, upload their creative and pay from their wallet. The screen owner then approves or declines the booking." },
  { q: "What types of ads are allowed?", a: "JPG, PNG or WEBP images and MP4 videos that comply with our content guidelines. Screen owners review every ad before it plays." },
  { q: "What is the typical payout cycle for screen owners?", a: "Earnings are recorded in your dashboard as soon as you approve a booking. Bank payouts are not automated yet — contact support to arrange a withdrawal." },
  { q: "How can I track my earnings and performance?", a: "Your screen owner dashboard shows bookings, earnings by month and earnings by screen." },
  { q: "How does BigXel Ads ensure ad quality?", a: "Screens are reviewed before listing and owners approve each ad booked on their screen." },
  { q: "Who can I contact for technical support?", a: `Use the form on this page or email ${site.email}.` },
];

const empty = { full_name: "", email: "", phone: "", topic: "", message: "" };

export default function Contact() {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ tone: "success" | "error"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setStatus(null);
    const e: Record<string, string> = {};
    if (form.full_name.trim().length < 2) e.full_name = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email address";
    if (form.phone && !/^\+?[0-9\s-]{10,16}$/.test(form.phone)) e.phone = "Enter a valid phone number";
    if (!form.topic) e.topic = "Choose a topic";
    if (form.message.trim().length < 10) e.message = "Message must be at least 10 characters";
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      const r = await api.post<{ detail: string }>("/api/contact", { ...form, phone: form.phone || null });
      setStatus({ tone: "success", msg: r.detail });
      setForm(empty);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors);
        setStatus({ tone: "error", msg: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { icon: Phone, t: "Call Us", v: site.phone, d: site.supportHours, href: site.phoneHref },
    { icon: Mail, t: "Email Us", v: site.email, d: "We reply within 24 hours", href: `mailto:${site.email}` },
    { icon: MessageCircle, t: "WhatsApp", v: site.phone, d: "Chat with us on WhatsApp", href: site.whatsappHref },
    { icon: MapPin, t: "Visit Us", v: site.company, d: `${site.address} · ${site.officeHours}` },
  ];

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-y-0 right-0 hidden w-[52%] lg:block" aria-hidden="true">
          <img src="/images/hero-contact.jpg" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />
        </div>
        <div className="container-page relative py-14">
          <div className="max-w-xl">
            <p className="eyebrow">Contact Us</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl">
              We&apos;re Here to Help
              <br />
              You Grow with <span className="text-gradient">BigXel Ads</span>
            </h1>
            <p className="mt-5 text-lg text-slate-600">Have questions or need assistance? Our team is ready to help you with anything you need.</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {[
                { icon: MessageSquare, t: "Quick Support", d: "We respond within 24 hours" },
                { icon: Headphones, t: "Expert Guidance", d: "Get help from our advertising experts" },
                { icon: ShieldCheck, t: "Reliable Solutions", d: "We're here to solve your problems" },
              ].map(({ icon: Icon, t, d }) => (
                <div key={t} className="flex gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-600 text-white"><Icon className="h-5 w-5" /></span>
                  <div><p className="text-sm font-semibold text-slate-900">{t}</p><p className="mt-0.5 text-xs text-slate-600">{d}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-8">
        <h2 className="text-center text-xl font-bold">Get in Touch</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ icon: Icon, t, v, d, href }) => (
            <div key={t} className="card flex gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-600 text-white"><Icon className="h-5 w-5" /></span>
              <div className="min-w-0">
                <h3 className="font-semibold">{t}</h3>
                {href ? <a href={href} className="mt-1 block break-words text-sm font-semibold text-slate-900 hover:text-brand-700" target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{v}</a> : <p className="mt-1 text-sm text-slate-700">{v}</p>}
                <p className="mt-1 text-xs text-slate-500">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page grid gap-6 py-8 lg:grid-cols-2">
        <form onSubmit={submit} noValidate className="card p-6" aria-labelledby="contact-form-title">
          <h2 id="contact-form-title" className="text-xl font-bold">Send Us a Message</h2>
          <p className="mt-1 text-sm text-slate-600">Fill out the form below and our team will get back to you.</p>
          <div className="mt-5 space-y-3">
            <Field label="Full Name" srOnlyLabel value={form.full_name} onChange={set("full_name")} error={errors.full_name} autoComplete="name" required />
            <Field label="Email Address" srOnlyLabel type="email" value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" required />
            <Field label="Phone Number (optional)" srOnlyLabel type="tel" value={form.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" />
            <SelectField label="How can we help you?" srOnlyLabel value={form.topic} onChange={set("topic")} error={errors.topic} required>
              <option value="">How can we help you?</option>
              {TOPICS.map((t) => <option key={t}>{t}</option>)}
            </SelectField>
            <TextAreaField label="Your Message" srOnlyLabel value={form.message} onChange={set("message")} error={errors.message} maxLength={4000} required />
          </div>
          {status && <Alert tone={status.tone} className="mt-4">{status.msg}</Alert>}
          <SubmitButton loading={loading} className="btn-primary mt-5 w-full py-3"><Send className="h-4 w-4" /> Send Message</SubmitButton>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500"><Lock className="h-3.5 w-3.5" /> Your information is safe with us. We never share your data.</p>
        </form>
        <div className="flex flex-col gap-6">
          <div className="card p-6">
            <h2 className="text-xl font-bold">Our Office</h2>
            <p className="mt-1 text-sm text-slate-600">Visit our office or reach out to us during business hours.</p>
            <dl className="mt-5 space-y-3 text-sm">
              {[
                { icon: Building2, k: "Company", v: site.company },
                { icon: MapPin, k: "Address", v: site.address },
                { icon: Mail, k: "Email", v: site.email },
                { icon: Phone, k: "Phone", v: site.phone },
                { icon: Clock, k: "Working Hours", v: site.officeHours },
              ].map(({ icon: Icon, k, v }) => (
                <div key={k} className="flex flex-wrap items-center gap-2">
                  <Icon className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  <dt className="font-semibold text-slate-900">{k}:</dt>
                  <dd className="text-slate-700">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="card min-h-[260px] flex-1 overflow-hidden">
            <iframe
              title="BigXel Ads office location map"
              className="h-full min-h-[260px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer"
              src="https://www.openstreetmap.org/export/embed.html?bbox=76.25%2C9.95%2C76.33%2C10.02&layer=mapnik&marker=9.985%2C76.29"
            />
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <p className="eyebrow text-center">Common Queries</p>
        <h2 className="mt-2 text-center text-2xl font-bold sm:text-3xl">Frequently Asked Questions</h2>
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {faqs.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </section>

      <section className="container-page pb-14 pt-4">
        <CtaBanner icon={Rocket} title="Ready to Get Started?" text="Join businesses and screen owners growing with BigXel Ads." cta="Create Your Account" to="/signup" />
      </section>
    </>
  );
}

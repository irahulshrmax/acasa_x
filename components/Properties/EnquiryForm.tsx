"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Loader2,
  Check,
  MessageCircle,
  Phone,
  ChevronDown,
  User,
  Mail,
} from "lucide-react";

const THEME = {
  primary: "#192334",
  secondary: "#1A2F4A",
  accent: "#C8AA78",
  accentLight: "#F5ECD7",
  muted: "#8A94A3",
  border: "#E8E6E1",
  surface: "#F8FAFC",
};

const FONT_DISPLAY = "'Display Pro', 'Playfair Display', Georgia, serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

// Country options with flags and dial codes
const COUNTRIES = [
  { code: "AE", label: "🇦🇪 UAE", dialCode: "+971" },
  { code: "SA", label: "🇸🇦 Saudi Arabia", dialCode: "+966" },
  { code: "KW", label: "🇰🇼 Kuwait", dialCode: "+965" },
  { code: "QA", label: "🇶🇦 Qatar", dialCode: "+974" },
  { code: "BH", label: "🇧🇭 Bahrain", dialCode: "+973" },
  { code: "OM", label: "🇴🇲 Oman", dialCode: "+968" },
  { code: "EG", label: "🇪🇬 Egypt", dialCode: "+20" },
  { code: "IN", label: "🇮🇳 India", dialCode: "+91" },
  { code: "PK", label: "🇵🇰 Pakistan", dialCode: "+92" },
  { code: "GB", label: "🇬🇧 UK", dialCode: "+44" },
  { code: "US", label: "🇺🇸 USA", dialCode: "+1" },
  { code: "CA", label: "🇨🇦 Canada", dialCode: "+1" },
  { code: "AU", label: "🇦🇺 Australia", dialCode: "+61" },
  { code: "DE", label: "🇩🇪 Germany", dialCode: "+49" },
  { code: "FR", label: "🇫🇷 France", dialCode: "+33" },
  { code: "IT", label: "🇮🇹 Italy", dialCode: "+39" },
  { code: "ES", label: "🇪🇸 Spain", dialCode: "+34" },
  { code: "CH", label: "🇨🇭 Switzerland", dialCode: "+41" },
  { code: "TR", label: "🇹🇷 Turkey", dialCode: "+90" },
  { code: "ZA", label: "🇿🇦 South Africa", dialCode: "+27" },
  { code: "NG", label: "🇳🇬 Nigeria", dialCode: "+234" },
  { code: "KE", label: "🇰🇪 Kenya", dialCode: "+254" },
  { code: "MY", label: "🇲🇾 Malaysia", dialCode: "+60" },
  { code: "SG", label: "🇸🇬 Singapore", dialCode: "+65" },
];

interface EnquiryFormProps {
  propertyName: string;
  refNumber: string;
  agentName?: string | null;
  agentPhone?: string | null;
  agentPhoto?: string | null;
  onSuccess?: () => void;
  className?: string;
  whatsappNumber?: string;
}

export default function EnquiryForm({
  propertyName,
  refNumber,
  agentName = null,
  agentPhone = null,
  agentPhoto = null,
  onSuccess,
  className = "",
  whatsappNumber = "971502590071",
}: EnquiryFormProps) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [selectedCountry, setSelectedCountry] = useState("AE");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAgentPopup, setShowAgentPopup] = useState(false);

  const selectedDialCode = COUNTRIES.find((c) => c.code === selectedCountry)?.dialCode || "+971";

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!form.email.includes("@") || !form.email.includes(".")) e.email = "Valid email required";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    if (!agreed || submitting) return;

    setSubmitting(true);

    try {
      const response = await fetch("/api/v1/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_name: propertyName,
          ref_number: refNumber,
          name: form.name,
          phone: `${selectedDialCode} ${form.phone}`,
          email: form.email,
          message: form.message || `I'm interested in ${propertyName}`,
          country_code: selectedCountry,
          agent_name: agentName,
          agent_phone: agentPhone,
          status: "pending",
        }),
      });

      if (!response.ok) throw new Error("Failed to submit enquiry");
    } catch (error) {
      console.error("Enquiry submission error:", error);
    }

    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    setDone(true);
    if (onSuccess) onSuccess();

    setTimeout(() => {
      setDone(false);
      setForm({ name: "", phone: "", email: "", message: "" });
      setErrors({});
      setAgreed(false);
    }, 5000);
  };

  const field = (key: keyof typeof form, label: string, type = "text", placeholder = "") => (
    <div>
      <label className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
        {label} <span className="text-red-400">*</span>
      </label>
      <input
        type={type}
        required
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => {
          setForm((p) => ({ ...p, [key]: e.target.value }));
          if (errors[key]) setErrors((p) => ({ ...p, [key]: "" }));
        }}
        className={`mt-1.5 w-full border px-3 py-2.5 text-[12px] transition-all focus:outline-none ${
          errors[key]
            ? "border-red-300 bg-red-50 focus:border-red-400"
            : "border-gray-200 bg-white focus:border-gray-400"
        }`}
        style={{ fontFamily: FONT_BODY }}
      />
      {errors[key] && <p className="mt-1 text-[10px] text-red-500">{errors[key]}</p>}
    </div>
  );

  const hasAgent = agentName || agentPhone;

  return (
    <div className={`border bg-white ${className}`} style={{ borderColor: THEME.border }}>
      {/* Header */}
      <div className="border-b p-5" style={{ borderColor: THEME.border, backgroundColor: THEME.primary }}>
        <h3 className="text-[16px] font-normal text-white" style={{ fontFamily: FONT_DISPLAY }}>
          Request Information
        </h3>
        <p className="mt-0.5 text-[10px] tracking-[0.1em] text-white/50">
          Get in touch about {propertyName}
        </p>
      </div>

      {/* Agent Info Bar - Clickable */}
      {hasAgent && (
        <div
          className="flex items-center gap-3 border-b px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
          style={{ borderColor: THEME.border }}
          onClick={() => setShowAgentPopup(true)}
        >
          {agentPhoto ? (
            <img src={agentPhoto} alt={agentName || "Agent"} className="h-10 w-10 rounded-full object-cover border" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium truncate" style={{ color: THEME.primary }}>
              {agentName || "Property Agent"}
            </p>
            <p className="text-[9px] uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
              Your Agent <span className="text-[#C8AA78]">●</span> Click for details
            </p>
          </div>
          <Phone className="h-3.5 w-3.5" style={{ color: THEME.accent }} />
        </div>
      )}

      {/* Form Body */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="mx-auto h-14 w-14 text-emerald-500" />
              </motion.div>
              <p className="mt-4 text-[17px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
                Enquiry Sent!
              </p>
              <p className="mt-1.5 text-[12px]" style={{ color: THEME.muted }}>
                Agent will contact you within 24 hours.
              </p>
              <div className="mt-4 rounded-[3px] bg-gray-50 p-3">
                <p className="text-[10px]" style={{ color: THEME.muted }}>
                  {propertyName} • Ref: {refNumber}
                </p>
                {agentName && (
                  <p className="mt-0.5 text-[9px]" style={{ color: THEME.muted }}>
                    Agent: {agentName}
                  </p>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.form key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmit} className="space-y-3.5">
              {/* Name */}
              {field("name", "Full Name", "text", "Your full name")}

              {/* Phone with Country Selector */}
              <div>
                <label className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <div className="mt-1.5 flex">
                  <div className="relative">
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="h-full border border-r-0 border-gray-200 bg-gray-50 px-2 py-2.5 pr-7 text-[11px] focus:outline-none appearance-none min-w-[90px]"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder={`${selectedDialCode} 50 000 0000`}
                    value={form.phone}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, phone: e.target.value }));
                      if (errors.phone) setErrors((p) => ({ ...p, phone: "" }));
                    }}
                    className={`flex-1 border px-3 py-2.5 text-[12px] transition-all focus:outline-none ${
                      errors.phone
                        ? "border-red-300 bg-red-50 focus:border-red-400"
                        : "border-gray-200 bg-white focus:border-gray-400"
                    }`}
                    style={{ fontFamily: FONT_BODY }}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-[10px] text-red-500">{errors.phone}</p>}
              </div>

              {/* Email */}
              {field("email", "Email Address", "email", "you@email.com")}

              {/* Message */}
              <div>
                <label className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: THEME.muted }}>
                  Message
                </label>
                <textarea
                  rows={3}
                  placeholder={`I'm interested in ${propertyName}...`}
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  className="mt-1.5 w-full resize-none border border-gray-200 px-3 py-2.5 text-[12px] transition-all focus:border-gray-400 focus:outline-none"
                  style={{ fontFamily: FONT_BODY }}
                />
              </div>

              {/* Terms */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <div className="relative mt-0.5">
                  <input type="checkbox" className="sr-only" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                  <div
                    className={`h-4 w-4 border-2 flex items-center justify-center transition-colors ${
                      agreed ? "border-transparent" : "border-gray-300 bg-white"
                    }`}
                    style={agreed ? { backgroundColor: THEME.primary } : {}}
                  >
                    {agreed && <Check className="h-2.5 w-2.5 text-white" />}
                  </div>
                </div>
                <span className="text-[10px] leading-relaxed" style={{ color: THEME.muted }}>
                  I agree to the{" "}
                  <Link href="/terms" className="underline hover:no-underline" style={{ color: THEME.primary }}>
                    Terms & Conditions
                  </Link>{" "}
                  and consent to being contacted.
                </span>
              </label>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`https://wa.me/${whatsappNumber}?text=I'm%20interested%20in%20${encodeURIComponent(propertyName)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 border py-3 text-[10px] font-medium uppercase tracking-[0.15em] transition-all hover:bg-emerald-500 hover:border-emerald-500 hover:text-white"
                  style={{ borderColor: THEME.border, color: THEME.primary }}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </a>

                <button
                  type="submit"
                  disabled={!agreed || submitting}
                  className="relative flex items-center justify-center gap-2 py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 overflow-hidden"
                  style={{ backgroundColor: THEME.primary }}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Sending
                    </span>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Agent Popup Modal */}
      <AnimatePresence>
        {showAgentPopup && hasAgent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowAgentPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-[18px]" style={{ fontFamily: FONT_DISPLAY, color: THEME.primary }}>
                  Your Agent
                </h3>
                <button onClick={() => setShowAgentPopup(false)} className="p-1 hover:bg-gray-100 rounded">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                {agentPhoto ? (
                  <img src={agentPhoto} alt={agentName || "Agent"} className="h-16 w-16 rounded-full object-cover border-2" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center border-2">
                    <User className="h-7 w-7 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="text-[15px] font-medium" style={{ color: THEME.primary }}>
                    {agentName || "Property Agent"}
                  </p>
                  {agentPhone && (
                    <p className="text-[12px] flex items-center gap-1" style={{ color: THEME.muted }}>
                      <Phone className="h-3 w-3" />
                      {agentPhone}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4" style={{ borderColor: THEME.border }}>
                <p className="text-[11px]" style={{ color: THEME.muted }}>
                  This agent will receive your enquiry for <strong className="text-[#192334]">{propertyName}</strong>
                </p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setShowAgentPopup(false);
                      document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex-1 py-2.5 text-[10px] font-medium uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: THEME.primary }}
                  >
                    Submit Enquiry
                  </button>
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=I'm%20interested%20in%20${encodeURIComponent(propertyName)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 border text-[10px] font-medium uppercase tracking-[0.15em] hover:bg-gray-50"
                    style={{ borderColor: THEME.border, color: THEME.primary }}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    WhatsApp
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
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
  X,
  Building2,
  Home,
} from "lucide-react";
import toast from "react-hot-toast";

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

// ─── COUNTRY OPTIONS ──────────────────────────────────────────────────────

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
  { code: "RU", label: "🇷🇺 Russia", dialCode: "+7" },
  { code: "CN", label: "🇨🇳 China", dialCode: "+86" },
  { code: "JP", label: "🇯🇵 Japan", dialCode: "+81" },
  { code: "KR", label: "🇰🇷 South Korea", dialCode: "+82" },
  { code: "BR", label: "🇧🇷 Brazil", dialCode: "+55" },
  { code: "MX", label: "🇲🇽 Mexico", dialCode: "+52" },
];

// ─── INTERFACES ───────────────────────────────────────────────────────────

interface EnquiryFormProps {
  /** Name of the property/project */
  propertyName: string;
  /** Reference number (optional) */
  refNumber?: string;
  /** Property ID (for property pages) */
  propertyId?: number | null;
  /** Project ID (for project pages) */
  projectId?: number | null;
  /** Agent ID */
  agentId?: number | null;
  /** Agent Name */
  agentName?: string | null;
  /** Agent Phone */
  agentPhone?: string | null;
  /** Agent Photo URL */
  agentPhoto?: string | null;
  /** Agent Email */
  agentEmail?: string | null;
  /** Listing type: "For Sale", "For Rent", "Off Plan" */
  listingType?: string;
  /** Item type: "property" or "project" - auto-detected */
  itemType?: "property" | "project";
  /** Callback on success */
  onSuccess?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** WhatsApp number */
  whatsappNumber?: string;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────

export default function EnquiryForm({
  propertyName,
  refNumber = "",
  propertyId = null,
  projectId = null,
  agentId = null,
  agentName = null,
  agentPhone = null,
  agentPhoto = null,
  agentEmail = null,
  listingType = "For Sale",
  itemType,
  onSuccess,
  className = "",
  whatsappNumber = "971502590071",
}: EnquiryFormProps) {
  // ─── Auto-detect item type ─────────────────────────────────────────────

  const detectedItemType = itemType || (projectId ? "project" : "property");
  const primaryId = propertyId || projectId || null;
  const isProject = detectedItemType === "project";

  // ─── State ──────────────────────────────────────────────────────────────

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

  // ─── Validation ─────────────────────────────────────────────────────────

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!form.email.includes("@") || !form.email.includes(".")) e.email = "Valid email required";
    return e;
  };

  // ─── Submit Handler ────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    if (!agreed || submitting) return;

    setSubmitting(true);

    try {
      // ─── Prepare payload for `enquire` table ──────────────────────
      const payload = {
        // ✅ IDs - auto-detect
        property_id: isProject ? null : primaryId,
        project_item_id: isProject ? primaryId : null,
        project_id: isProject ? primaryId : null, // For backward compatibility
        item_type: detectedItemType,
        type: "Inquiry",
        source: "Website",
        agent_id: agentId || undefined,
        country: selectedCountry,
        message: form.message || `I'm interested in ${propertyName}`,
        contact_type: "Buyer",
        listing_type: listingType,
        contact_source: "Website",
        lead_source: "Website",

        // ✅ Contact details
        name: form.name,
        email: form.email,
        phone: `${selectedDialCode} ${form.phone}`,

        // ✅ Status
        status: 1,
        lead_status: 1,

        // ✅ Zoho sync flag
        zoho_synced: 0,

        // ✅ Agent info
        agent_name: agentName,
        agent_phone: agentPhone,
        agent_email: agentEmail,

        // ✅ Property info
        property_name: propertyName,
        ref_number: refNumber,

        // ✅ Type indicator for debugging
        _type: isProject ? "project" : "property",
        _id: primaryId,
      };

      console.log(`📩 Submitting ${isProject ? 'Project' : 'Property'} enquiry:`, payload);

      const response = await fetch("/api/v1/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit enquiry");
      }

      toast.success(`✅ ${isProject ? 'Project' : 'Property'} enquiry submitted successfully!`);

      if (onSuccess) onSuccess();

      // Show success state
      setDone(true);

      // Reset form after 5 seconds
      setTimeout(() => {
        setDone(false);
        setForm({ name: "", phone: "", email: "", message: "" });
        setErrors({});
        setAgreed(false);
      }, 5000);
    } catch (error: any) {
      console.error("❌ Enquiry submission error:", error);
      toast.error(error.message || "Failed to submit enquiry");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Form Field Helper ──────────────────────────────────────────────────

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

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className={`border bg-white ${className}`} style={{ borderColor: THEME.border }}>
      {/* ─── Header ── */}
      <div className="border-b p-5" style={{ borderColor: THEME.border, backgroundColor: THEME.primary }}>
        <div className="flex items-center gap-2">
          {isProject ? (
            <Building2 className="h-4 w-4 text-white/50" />
          ) : (
            <Home className="h-4 w-4 text-white/50" />
          )}
          <h3 className="text-[16px] font-normal text-white" style={{ fontFamily: FONT_DISPLAY }}>
            {isProject ? "Project Enquiry" : "Property Enquiry"}
          </h3>
        </div>
        <p className="mt-0.5 text-[10px] tracking-[0.1em] text-white/50">
          Get in touch about {propertyName}
        </p>
        {refNumber && (
          <p className="mt-1 text-[9px] tracking-[0.1em] text-white/30">
            Ref: {refNumber}
          </p>
        )}
      </div>

      {/* ─── Agent Info Bar (Clickable) ── */}
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

      {/* ─── Form Body ── */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          {done ? (
            // ─── Success State ──
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
                  {propertyName}
                </p>
                {refNumber && (
                  <p className="mt-0.5 text-[9px]" style={{ color: THEME.muted }}>
                    Ref: {refNumber}
                  </p>
                )}
                {agentName && (
                  <p className="mt-0.5 text-[9px]" style={{ color: THEME.muted }}>
                    Agent: {agentName}
                  </p>
                )}
              </div>
            </motion.div>
          ) : (
            // ─── Form State ──
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
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
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

      {/* ─── Agent Popup Modal ── */}
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
                <button
                  onClick={() => setShowAgentPopup(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                {agentPhoto ? (
                  <img
                    src={agentPhoto}
                    alt={agentName || "Agent"}
                    className="h-16 w-16 rounded-full object-cover border-2"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center border-2">
                    <User className="h-7 w-7 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="text-[15px] font-medium" style={{ color: THEME.primary }}>
                    {agentName || "Property Agent"}
                  </p>
                  {agentEmail && (
                    <p className="text-[12px] flex items-center gap-1" style={{ color: THEME.muted }}>
                      <Mail className="h-3 w-3" />
                      {agentEmail}
                    </p>
                  )}
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
                  This agent will receive your enquiry for{" "}
                  <strong className="text-[#192334]">{propertyName}</strong>
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
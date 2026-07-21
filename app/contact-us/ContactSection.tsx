"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useState, useCallback, useMemo, useEffect, Suspense } from "react";
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  ChevronDown,
  ExternalLink,
  Send,
  Building2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import toast, { Toaster } from "react-hot-toast";

// ==================== FONTS & THEME ====================

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const THEME = {
  primary: "#192334",
  muted: "#8A94A3",
  border: "#E8E6E1",
  accent: "#C8AA78",
  surface: "#F7F3EF",
};

// ==================== TYPES ====================

type ContactCard = {
  icon: ReactNode;
  title: string;
  info: string;
  subtitle: string;
  href?: string;
};

type LocationCard = {
  label: string;
  address: string;
  href: string;
};

type FAQ = {
  question: string;
  answer: string;
};

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  enquiryType: string;
  location: string;
  message: string;

  company: string;
  nationality: string;
  property_type: string;
  source: string;
  contact_type: string;
  designation: string;
  website: string;
  whats_app: string;
  facebook: string;
  insta: string;
  linkedin: string;
  landline: string;
  mortgage: string;
  brn_number: string;
  job_role: string;
  priority: string;
  profile: string;

  third_party_client_name: string;
  third_party_client_email: string;
  third_party_client_mobile: string;
};

type FormErrors = Partial<Record<keyof FormState | "phone", string>>;

// ==================== CONSTANTS ====================

const CONTACT_API_URL = "/api/v1/zoho/contact";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_REGEX = /^[\p{L}\s'.-]{2,50}$/u;

const WHATSAPP_NUMBER = "971581645714";
const COMPANY_PHONE = "+971 58 164 5714";
const COMPANY_EMAIL = "marketing@acasa.ae";

const INITIAL_FORM_STATE: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  enquiryType: "",
  location: "",
  message: "",

  company: "",
  nationality: "",
  property_type: "",
  source: "Website Contact",
  contact_type: "",
  designation: "",
  website: "",
  whats_app: "",
  facebook: "",
  insta: "",
  linkedin: "",
  landline: "",
  mortgage: "",
  brn_number: "",
  job_role: "",
  priority: "",
  profile: "",

  third_party_client_name: "",
  third_party_client_email: "",
  third_party_client_mobile: "",
};

const ENQUIRY_TYPES = [
  { value: "Buy Property", label: "Buy Property" },
  { value: "Sell Property", label: "Sell Property" },
  { value: "Rent Property", label: "Rent Property" },
  { value: "Investment", label: "Investment" },
  { value: "Property Management", label: "Property Management" },
  { value: "General Inquiry", label: "General Inquiry" },
  { value: "Schedule Viewing", label: "Schedule Viewing" },
];

const PROPERTY_TYPES = [
  "Apartment",
  "Villa",
  "Townhouse",
  "Penthouse",
  "Studio",
  "Duplex",
  "Mansion",
  "Commercial",
  "Land",
  "Other",
];

const NATIONALITIES = [
  "UAE",
  "USA",
  "UK",
  "Canada",
  "Australia",
  "India",
  "Pakistan",
  "Egypt",
  "Lebanon",
  "Saudi Arabia",
  "Kuwait",
  "Qatar",
  "Oman",
  "Bahrain",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Russia",
  "China",
  "Japan",
  "Other",
];

const CONTACT_TYPES = [
  "Individual",
  "Company",
  "Developer",
  "Agent",
  "Broker",
  "Investor",
  "Other",
];

const SOURCES = ["Website Contact", "Website Contact Agent", "Property Finder"];

const PRIORITY_LEVELS = ["Low", "Medium", "High", "Urgent"];

const CONTACT_CARDS: ContactCard[] = [
  {
    icon: <Phone className="h-4 w-4" strokeWidth={1.5} />,
    title: "Call Us",
    info: COMPANY_PHONE,
    subtitle: "Mon-Sat, 9AM-7PM",
    href: `tel:${COMPANY_PHONE.replace(/\s/g, "")}`,
  },
  {
    icon: <Mail className="h-4 w-4" strokeWidth={1.5} />,
    title: "Email Us",
    info: COMPANY_EMAIL,
    subtitle: "Reply within 24h",
    href: `mailto:${COMPANY_EMAIL}`,
  },
  {
    icon: <MapPin className="h-4 w-4" strokeWidth={1.5} />,
    title: "Visit Us",
    info: "Dubai, UAE",
    subtitle: "By appointment",
    href: "https://maps.google.com/?q=Downtown+Dubai",
  },
  {
    icon: <MessageCircle className="h-4 w-4" strokeWidth={1.5} />,
    title: "Live Chat",
    info: "Start a chat",
    subtitle: "Available now",
    href: `https://wa.me/${WHATSAPP_NUMBER}`,
  },
];

const LOCATION_CARDS: LocationCard[] = [
  {
    label: "Headquarters",
    address: "Boulevard Plaza, Tower 1, Downtown Dubai",
    href: "https://maps.google.com/?q=Boulevard Plaza Tower 1 Downtown Dubai",
  },
  {
    label: "Branch Office",
    address: "The Opus Tower, Business Bay",
    href: "https://maps.google.com/?q=The Opus Tower Business Bay Dubai",
  },
  {
    label: "Branch Office",
    address: "Marina Plaza, Level 3, Dubai Marina",
    href: "https://maps.google.com/?q=Marina Plaza Dubai Marina",
  },
];

const FAQS: FAQ[] = [
  {
    question: "What are your service fees?",
    answer:
      "Our service fees vary depending on the transaction type and property value. Contact us for a personalized quote with no obligation.",
  },
  {
    question: "How long does it take to sell a property?",
    answer:
      "On average, properties listed with ACASA sell within 30-60 days. We use strategic pricing and premium marketing to ensure the fastest possible sale.",
  },
  {
    question: "Do you offer property management services?",
    answer:
      "Yes, we provide comprehensive property management services including tenant screening, rent collection, maintenance coordination, and more.",
  },
  {
    question: "Can I schedule a property viewing?",
    answer:
      "Absolutely! You can schedule viewings directly through our website or by contacting our team.",
  },
];

// ==================== STYLES ====================

const PHONE_STYLES = `
  .phone-input-wrapper .PhoneInput {
    display: flex;
    align-items: center;
    border-bottom: 1px solid #E8E6E1;
    transition: border-color 0.2s;
  }
  .phone-input-wrapper .PhoneInput:focus-within {
    border-bottom-color: #192334;
  }
  .phone-input-wrapper .PhoneInputCountry {
    display: flex;
    align-items: center;
    gap: 4px;
    padding-right: 8px;
    cursor: pointer;
    flex-shrink: 0;
  }
  .phone-input-wrapper .PhoneInputCountryIcon {
    width: 20px;
    height: 14px;
    border-radius: 2px;
    overflow: hidden;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
    flex-shrink: 0;
  }
  .phone-input-wrapper .PhoneInputCountryIcon img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .phone-input-wrapper .PhoneInputCountrySelect {
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
    top: 0;
    left: 0;
  }
  .phone-input-wrapper .PhoneInputCountrySelectArrow {
    display: none;
  }
  .phone-input-wrapper .PhoneInputCountryIconImg {
    display: block;
    width: 20px;
    height: 14px;
  }
  .phone-input-wrapper .PhoneInputInput {
    flex: 1;
    height: 44px;
    background: transparent;
    border: none;
    outline: none;
    font-size: 13px;
    color: #192334;
    padding: 0;
    font-family: 'Inter', -apple-system, sans-serif;
  }
  .phone-input-wrapper .PhoneInputInput::placeholder {
    color: #d1d5db;
  }
  .phone-input-wrapper.has-error .PhoneInput {
    border-bottom-color: #ef4444;
  }
`;

// ==================== HELPERS ====================

function trimToNull(value?: string): string | null {
  const cleaned = value?.trim() || "";
  return cleaned.length > 0 ? cleaned : null;
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function getServerErrorMessage(result: any): string {
  if (!result) return "Invalid server response";
  if (Array.isArray(result.errors) && result.errors.length > 0) {
    const first = result.errors[0];
    if (typeof first === "string") return first;
    if (first?.message) return first.message;
    if (first?.errors?.[0]?.message) return first.errors[0].message;
  }
  if (result?.message) return result.message;
  return "Something went wrong";
}

// ==================== COMPONENTS ====================

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      className="mt-1 flex items-center gap-1 text-[10px] text-red-500"
      style={{ fontFamily: FONT_BODY }}
    >
      <AlertCircle className="h-3 w-3" strokeWidth={2} />
      {message}
    </p>
  );
}

function InputField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.14em] text-[#8A94A3]"
        style={{ fontFamily: FONT_BODY }}
      >
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

function SuccessView({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
        <CheckCircle2 className="h-7 w-7 text-green-500" strokeWidth={1.5} />
      </div>

      <h2
        className="mt-4 text-[26px] font-normal text-[#192334] sm:text-[30px]"
        style={{ fontFamily: FONT_DISPLAY }}
      >
        Thank You
      </h2>

      <p
        className="mt-3 max-w-sm text-[13px] leading-relaxed text-[#8A94A3]"
        style={{ fontFamily: FONT_BODY }}
      >
        Your enquiry has been submitted successfully. Our team will contact you within 24 hours.
      </p>

      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-flex h-11 items-center justify-center gap-2 border border-[#192334] px-8 text-[10px] font-medium uppercase tracking-[0.18em] text-[#192334] transition-all duration-300 hover:bg-[#192334] hover:text-white"
        style={{ fontFamily: FONT_BODY }}
      >
        Send Another Enquiry
      </button>
    </div>
  );
}

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);

  return (
    <article
      className={`overflow-hidden border bg-white transition-all duration-300 ${
        open ? "border-[#192334]/30" : "border-[#E8E6E1] hover:border-[#192334]/20"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
        aria-expanded={open}
      >
        <h3
          className="text-[13px] font-medium leading-snug text-[#192334] sm:text-[14px]"
          style={{ fontFamily: FONT_BODY }}
        >
          {faq.question}
        </h3>

        <span
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center border border-[#E8E6E1] text-[#192334] transition-all duration-300 ${
            open ? "rotate-180 bg-[#192334] text-white border-[#192334]" : ""
          }`}
        >
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p
            className="px-5 pb-4 text-[12px] leading-relaxed text-[#8A94A3] sm:px-6 sm:pb-5 sm:text-[13px]"
            style={{ fontFamily: FONT_BODY }}
          >
            {faq.answer}
          </p>
        </div>
      </div>
    </article>
  );
}

// ==================== CONTENT COMPONENT ====================

function ContactContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState<FormState>({ ...INITIAL_FORM_STATE });
  const [phoneValue, setPhoneValue] = useState<string | undefined>(undefined);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const type = searchParams.get("type");

    if (type === "viewing") {
      setFormData((prev) => ({
        ...prev,
        enquiryType: "Schedule Viewing",
        message:
          "I would like to schedule a property viewing. Please contact me to arrange a suitable time.",
      }));
    } else if (type === "buy") {
      setFormData((prev) => ({ ...prev, enquiryType: "Buy Property" }));
    } else if (type === "sell") {
      setFormData((prev) => ({ ...prev, enquiryType: "Sell Property" }));
    } else if (type === "rent") {
      setFormData((prev) => ({ ...prev, enquiryType: "Rent Property" }));
    } else if (type === "investment") {
      setFormData((prev) => ({ ...prev, enquiryType: "Investment" }));
    }
  }, [searchParams]);

  const inputClass = useCallback(
    (field: keyof FormErrors) => {
      return [
        "h-11 w-full border-b bg-transparent px-0 text-[13px] text-[#192334] outline-none transition-colors placeholder:text-neutral-300",
        formErrors[field]
          ? "border-red-400 focus:border-red-500"
          : "border-[#E8E6E1] focus:border-[#192334]",
      ].join(" ");
    },
    [formErrors]
  );

  const selectClass = useCallback(
    (field: keyof FormErrors) => {
      return [
        "h-11 w-full border-b bg-transparent text-[13px] text-[#192334] outline-none transition-colors",
        formErrors[field]
          ? "border-red-400 focus:border-red-500"
          : "border-[#E8E6E1] focus:border-[#192334]",
      ].join(" ");
    },
    [formErrors]
  );

  const handleChange = useCallback((field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handlePhoneChange = useCallback((value: string | undefined) => {
    setPhoneValue(value);
    setFormErrors((prev) => {
      if (!prev.phone) return prev;
      const next = { ...prev };
      delete next.phone;
      return next;
    });
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};

    const firstName = formData.first_name.trim();
    if (!firstName) errors.first_name = "First name is required";
    else if (!NAME_REGEX.test(firstName)) errors.first_name = "Enter a valid first name";

    const lastName = formData.last_name.trim();
    if (lastName && !NAME_REGEX.test(lastName)) errors.last_name = "Enter a valid last name";

    const email = formData.email.trim().toLowerCase();
    if (!email) errors.email = "Email is required";
    else if (!EMAIL_REGEX.test(email)) errors.email = "Please enter a valid email";

    if (!phoneValue) errors.phone = "Phone number is required";
    else if (!isValidPhoneNumber(phoneValue)) errors.phone = "Please enter a valid phone number";

    if (!formData.enquiryType) errors.enquiryType = "Please select enquiry type";

    const location = formData.location.trim();
    if (!location) errors.location = "Location is required";
    else if (location.length < 2) errors.location = "Please enter a valid location";

    if (formData.website.trim() && !isValidUrl(formData.website.trim()))
      errors.website = "Website must be a valid URL";

    if (
      formData.third_party_client_email.trim() &&
      !EMAIL_REGEX.test(formData.third_party_client_email.trim().toLowerCase())
    ) {
      errors.third_party_client_email = "Client email is invalid";
    }

    if (formData.message.length > 1000) errors.message = "Message cannot exceed 1000 characters";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, phoneValue]);

  const submitContact = useCallback(async (payload: Record<string, any>) => {
    const response = await fetch(CONTACT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      throw new Error(getServerErrorMessage(result));
    }

    return result;
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form", { id: "contact-submit" });
      return;
    }

    setSubmitting(true);
    toast.loading("Submitting your enquiry...", { id: "contact-submit" });

    try {
      const finalMessage = [
        formData.message.trim(),
        `Enquiry Type: ${formData.enquiryType}`,
        `Preferred Location: ${formData.location.trim()}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      const payload: Record<string, any> = {
        first_name: formData.first_name.trim(),
        last_name: trimToNull(formData.last_name) || "",
        email: formData.email.trim().toLowerCase(),
        phone: phoneValue?.replace(/[\s+]/g, "") || "",
        enquiryType: formData.enquiryType,
        location: formData.location.trim(),
        message: finalMessage,
        source: formData.source || "Website Contact",
        type: "B2C",
        status: 1,
        lead_status: 1,
      };

      const optionalFields: Record<string, string> = {
        company: formData.company,
        nationality: formData.nationality,
        property_type: formData.property_type,
        contact_type: formData.contact_type,
        designation: formData.designation,
        website: formData.website,
        whats_app: formData.whats_app,
        facebook: formData.facebook,
        insta: formData.insta,
        linkedin: formData.linkedin,
        landline: formData.landline,
        mortgage: formData.mortgage,
        brn_number: formData.brn_number,
        job_role: formData.job_role,
        priority: formData.priority,
        profile: formData.profile,
        third_party_client_name: formData.third_party_client_name,
        third_party_client_email: formData.third_party_client_email,
        third_party_client_mobile: formData.third_party_client_mobile,
      };

      for (const [key, value] of Object.entries(optionalFields)) {
        const cleaned = trimToNull(value);
        if (cleaned) payload[key] = cleaned;
      }

      const result = await submitContact(payload);

      toast.success(result?.message || "Enquiry submitted successfully!", {
        id: "contact-submit",
      });

      setSubmitted(true);
      setFormData({ ...INITIAL_FORM_STATE });
      setPhoneValue(undefined);
      setFormErrors({});
      setShowAdvanced(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit enquiry", { id: "contact-submit" });
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappLink = useMemo(() => {
    const fullName = `${formData.first_name} ${formData.last_name}`.trim();
    const msg = fullName
      ? `Hi, I'm ${fullName}. I'm interested in ${
          formData.enquiryType || "your services"
        }${formData.location ? ` in ${formData.location}` : ""}.`
      : "Hi, I'm interested in your real estate services.";
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  }, [formData.first_name, formData.last_name, formData.enquiryType, formData.location]);

  return (
    <>
      {/* HERO + FORM */}
      <section className="px-4 pt-6 pb-8 sm:px-6 sm:pt-10 sm:pb-12 lg:px-8 lg:pt-12 lg:pb-14">
        <div className="relative mx-auto max-w-[1680px]">
          <div className="relative hidden h-[200px] w-full overflow-hidden sm:block sm:h-[300px] md:h-[340px] lg:h-[380px]">
            <Image
              src="/contact/contact.jpg"
              alt="Contact ACASA"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#192334]/40 to-transparent" />
          </div>

          <div className="relative h-[160px] w-full overflow-hidden sm:hidden">
            <Image
              src="/contact/contact.jpg"
              alt="Contact ACASA"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#192334]/40 to-transparent" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[680px] bg-white px-5 py-6 shadow-[0_24px_60px_rgba(15,23,42,0.15)] sm:-mt-48 sm:px-8 sm:py-8 lg:-mt-[300px] lg:px-12 lg:py-10">
            {submitted ? (
              <SuccessView onReset={() => setSubmitted(false)} />
            ) : (
              <>
                <div className="text-center">
                  <p
                    className="text-[10px] uppercase tracking-[0.24em] text-[#8A94A3]"
                    style={{ fontFamily: FONT_BODY }}
                  >
                    Get in Touch
                  </p>

                  <h2
                    className="mt-2 text-[26px] font-normal leading-tight text-[#192334] sm:text-[32px]"
                    style={{ fontFamily: FONT_DISPLAY }}
                  >
                    Send Us a Message
                  </h2>

                  <p
                    className="mt-3 text-[13px] leading-relaxed text-[#8A94A3] sm:text-[14px]"
                    style={{ fontFamily: FONT_BODY }}
                  >
                    Fill in your details and we will contact you shortly.
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="mt-6 space-y-4 sm:mt-7"
                  noValidate
                  style={{ fontFamily: FONT_BODY }}
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InputField label="First Name" required error={formErrors.first_name}>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => handleChange("first_name", e.target.value)}
                        placeholder="John"
                        maxLength={50}
                        autoComplete="given-name"
                        className={inputClass("first_name")}
                        disabled={submitting}
                      />
                    </InputField>

                    <InputField label="Last Name" error={formErrors.last_name}>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => handleChange("last_name", e.target.value)}
                        placeholder="Smith"
                        maxLength={50}
                        autoComplete="family-name"
                        className={inputClass("last_name")}
                        disabled={submitting}
                      />
                    </InputField>
                  </div>

                  <InputField label="Email" required error={formErrors.email}>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="john@example.com"
                      maxLength={100}
                      autoComplete="email"
                      className={inputClass("email")}
                      disabled={submitting}
                    />
                  </InputField>

                  <InputField label="Phone" required error={formErrors.phone}>
                    <div
                      className={`phone-input-wrapper relative ${
                        formErrors.phone ? "has-error" : ""
                      }`}
                    >
                      <PhoneInput
                        international
                        defaultCountry="AE"
                        value={phoneValue}
                        onChange={handlePhoneChange}
                        placeholder="XX XXX XXXX"
                        countryCallingCodeEditable={false}
                        smartCaret={false}
                        disabled={submitting}
                      />
                      <span className="pointer-events-none absolute left-[30px] top-1/2 -translate-y-1/2">
                        <ChevronDown className="h-3 w-3 text-neutral-400" strokeWidth={2} />
                      </span>
                    </div>
                  </InputField>

                  <InputField
                    label="Enquiry Type"
                    required
                    error={formErrors.enquiryType}
                  >
                    <select
                      value={formData.enquiryType}
                      onChange={(e) => handleChange("enquiryType", e.target.value)}
                      disabled={submitting}
                      className={selectClass("enquiryType")}
                    >
                      <option value="">Select Type</option>
                      {ENQUIRY_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </InputField>

                  <InputField label="Location" required error={formErrors.location}>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleChange("location", e.target.value)}
                      placeholder="Dubai Marina, Dubai"
                      maxLength={200}
                      autoComplete="address-level2"
                      className={inputClass("location")}
                      disabled={submitting}
                    />
                  </InputField>

                  <InputField label="Message" error={formErrors.message}>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => handleChange("message", e.target.value)}
                      placeholder="Tell us more about your requirements..."
                      maxLength={1000}
                      disabled={submitting}
                      className="w-full resize-none border-b border-[#E8E6E1] bg-transparent px-0 py-2 text-[13px] text-[#192334] outline-none transition-colors placeholder:text-neutral-300 focus:border-[#192334]"
                    />
                    <p className="mt-1 text-right text-[10px] text-[#8A94A3]">
                      {formData.message.length}/1000
                    </p>
                  </InputField>

                  <button
                    type="button"
                    onClick={() => setShowAdvanced((prev) => !prev)}
                    className="flex w-full items-center justify-between border-t border-[#E8E6E1] pt-4 text-[10px] uppercase tracking-[0.18em] text-[#8A94A3] transition-colors hover:text-[#192334]"
                  >
                    <span>Advanced Options</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-300 ${
                        showAdvanced ? "rotate-180" : ""
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>

                  {showAdvanced && (
                    <div className="space-y-4 border-t border-[#E8E6E1] pt-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <InputField label="Company" error={formErrors.company}>
                          <input
                            type="text"
                            value={formData.company}
                            onChange={(e) => handleChange("company", e.target.value)}
                            placeholder="Company Name"
                            maxLength={200}
                            className={inputClass("company")}
                            disabled={submitting}
                          />
                        </InputField>

                        <InputField label="Designation" error={formErrors.designation}>
                          <input
                            type="text"
                            value={formData.designation}
                            onChange={(e) => handleChange("designation", e.target.value)}
                            placeholder="Job Title"
                            maxLength={200}
                            className={inputClass("designation")}
                            disabled={submitting}
                          />
                        </InputField>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <InputField label="Nationality" error={formErrors.nationality}>
                          <select
                            value={formData.nationality}
                            onChange={(e) => handleChange("nationality", e.target.value)}
                            disabled={submitting}
                            className={selectClass("nationality")}
                          >
                            <option value="">Select Nationality</option>
                            {NATIONALITIES.map((nationality) => (
                              <option key={nationality} value={nationality}>
                                {nationality}
                              </option>
                            ))}
                          </select>
                        </InputField>

                        <InputField label="Property Type" error={formErrors.property_type}>
                          <select
                            value={formData.property_type}
                            onChange={(e) => handleChange("property_type", e.target.value)}
                            disabled={submitting}
                            className={selectClass("property_type")}
                          >
                            <option value="">Select Property Type</option>
                            {PROPERTY_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </InputField>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <InputField label="Contact Type" error={formErrors.contact_type}>
                          <select
                            value={formData.contact_type}
                            onChange={(e) => handleChange("contact_type", e.target.value)}
                            disabled={submitting}
                            className={selectClass("contact_type")}
                          >
                            <option value="">Select Contact Type</option>
                            {CONTACT_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </InputField>

                        <InputField label="Source" error={formErrors.source}>
                          <select
                            value={formData.source}
                            onChange={(e) => handleChange("source", e.target.value)}
                            disabled={submitting}
                            className={selectClass("source")}
                          >
                            {SOURCES.map((source) => (
                              <option key={source} value={source}>
                                {source}
                              </option>
                            ))}
                          </select>
                        </InputField>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <InputField label="Website" error={formErrors.website}>
                          <input
                            type="url"
                            value={formData.website}
                            onChange={(e) => handleChange("website", e.target.value)}
                            placeholder="https://example.com"
                            maxLength={255}
                            className={inputClass("website")}
                            disabled={submitting}
                          />
                        </InputField>

                        <InputField label="WhatsApp" error={formErrors.whats_app}>
                          <input
                            type="text"
                            value={formData.whats_app}
                            onChange={(e) => handleChange("whats_app", e.target.value)}
                            placeholder="+971 50 123 4567"
                            maxLength={50}
                            className={inputClass("whats_app")}
                            disabled={submitting}
                          />
                        </InputField>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <InputField label="Facebook" error={formErrors.facebook}>
                          <input
                            type="text"
                            value={formData.facebook}
                            onChange={(e) => handleChange("facebook", e.target.value)}
                            placeholder="Facebook URL"
                            maxLength={255}
                            className={inputClass("facebook")}
                            disabled={submitting}
                          />
                        </InputField>

                        <InputField label="Instagram" error={formErrors.insta}>
                          <input
                            type="text"
                            value={formData.insta}
                            onChange={(e) => handleChange("insta", e.target.value)}
                            placeholder="Instagram URL"
                            maxLength={255}
                            className={inputClass("insta")}
                            disabled={submitting}
                          />
                        </InputField>

                        <InputField label="LinkedIn" error={formErrors.linkedin}>
                          <input
                            type="text"
                            value={formData.linkedin}
                            onChange={(e) => handleChange("linkedin", e.target.value)}
                            placeholder="LinkedIn URL"
                            maxLength={255}
                            className={inputClass("linkedin")}
                            disabled={submitting}
                          />
                        </InputField>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <InputField label="Landline" error={formErrors.landline}>
                          <input
                            type="text"
                            value={formData.landline}
                            onChange={(e) => handleChange("landline", e.target.value)}
                            placeholder="04 123 4567"
                            maxLength={50}
                            className={inputClass("landline")}
                            disabled={submitting}
                          />
                        </InputField>

                        <InputField label="BRN Number" error={formErrors.brn_number}>
                          <input
                            type="text"
                            value={formData.brn_number}
                            onChange={(e) => handleChange("brn_number", e.target.value)}
                            placeholder="BRN-12345"
                            maxLength={100}
                            className={inputClass("brn_number")}
                            disabled={submitting}
                          />
                        </InputField>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <InputField label="Mortgage" error={formErrors.mortgage}>
                          <select
                            value={formData.mortgage}
                            onChange={(e) => handleChange("mortgage", e.target.value)}
                            disabled={submitting}
                            className={selectClass("mortgage")}
                          >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </InputField>

                        <InputField label="Priority" error={formErrors.priority}>
                          <select
                            value={formData.priority}
                            onChange={(e) => handleChange("priority", e.target.value)}
                            disabled={submitting}
                            className={selectClass("priority")}
                          >
                            <option value="">Select Priority</option>
                            {PRIORITY_LEVELS.map((level) => (
                              <option key={level} value={level}>
                                {level}
                              </option>
                            ))}
                          </select>
                        </InputField>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <InputField label="Job Role" error={formErrors.job_role}>
                          <input
                            type="text"
                            value={formData.job_role}
                            onChange={(e) => handleChange("job_role", e.target.value)}
                            placeholder="CEO, Manager, Investor..."
                            maxLength={200}
                            className={inputClass("job_role")}
                            disabled={submitting}
                          />
                        </InputField>

                        <InputField label="Profile" error={formErrors.profile}>
                          <input
                            type="text"
                            value={formData.profile}
                            onChange={(e) => handleChange("profile", e.target.value)}
                            placeholder="Profile"
                            maxLength={200}
                            className={inputClass("profile")}
                            disabled={submitting}
                          />
                        </InputField>
                      </div>

                      <div className="border-t border-[#E8E6E1] pt-4">
                        <p
                          className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#8A94A3]"
                          style={{ fontFamily: FONT_BODY }}
                        >
                          Third Party Client Details
                        </p>

                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <InputField
                            label="Client Name"
                            error={formErrors.third_party_client_name}
                          >
                            <input
                              type="text"
                              value={formData.third_party_client_name}
                              onChange={(e) =>
                                handleChange("third_party_client_name", e.target.value)
                              }
                              placeholder="Client Name"
                              maxLength={100}
                              className={inputClass("third_party_client_name")}
                              disabled={submitting}
                            />
                          </InputField>

                          <InputField
                            label="Client Email"
                            error={formErrors.third_party_client_email}
                          >
                            <input
                              type="email"
                              value={formData.third_party_client_email}
                              onChange={(e) =>
                                handleChange("third_party_client_email", e.target.value)
                              }
                              placeholder="client@example.com"
                              maxLength={100}
                              className={inputClass("third_party_client_email")}
                              disabled={submitting}
                            />
                          </InputField>

                          <InputField
                            label="Client Mobile"
                            error={formErrors.third_party_client_mobile}
                          >
                            <input
                              type="text"
                              value={formData.third_party_client_mobile}
                              onChange={(e) =>
                                handleChange("third_party_client_mobile", e.target.value)
                              }
                              placeholder="+971 50 123 4567"
                              maxLength={50}
                              className={inputClass("third_party_client_mobile")}
                              disabled={submitting}
                            />
                          </InputField>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ACTION BUTTONS */}
                  <div className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-2">
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex h-12 items-center justify-center gap-2.5 border border-[#E8E6E1] bg-white text-[10px] font-medium uppercase tracking-[0.18em] text-[#192334] transition-all duration-300 hover:border-[#25D366] hover:text-[#25D366]"
                      style={{ fontFamily: FONT_BODY }}
                    >
                      <MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />
                      WhatsApp
                    </a>

                    <button
                      type="submit"
                      disabled={submitting}
                      className={`group inline-flex h-12 items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white transition-all duration-300 ${
                        submitting
                          ? "cursor-not-allowed bg-[#192334]/60"
                          : "bg-[#192334] hover:bg-[#263550]"
                      }`}
                      style={{ fontFamily: FONT_BODY }}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send
                            className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            strokeWidth={2}
                          />
                          Submit Enquiry
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* CONTACT CARDS */}
      <section className="pb-8 sm:pb-12 lg:pb-14">
        <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {CONTACT_CARDS.map((card) => {
              const isExternal = card.href?.startsWith("http");
              const Wrapper = card.href ? "a" : "div";
              const linkProps = card.href
                ? {
                    href: card.href,
                    target: isExternal ? "_blank" : undefined,
                    rel: isExternal ? "noreferrer" : undefined,
                  }
                : {};

              return (
                <Wrapper
                  key={card.title}
                  {...(linkProps as any)}
                  className="group relative flex min-h-[130px] cursor-pointer flex-col items-center justify-center border border-[#E8E6E1] bg-white px-4 py-5 text-center transition-all duration-300 hover:border-[#192334]/30 sm:min-h-[150px]"
                  style={{ fontFamily: FONT_BODY }}
                >
                  <div className="mb-3 flex h-11 w-11 items-center justify-center border border-[#E8E6E1] text-[#192334] transition-all duration-300 group-hover:bg-[#192334] group-hover:text-white group-hover:border-[#192334]">
                    {card.icon}
                  </div>

                  <p
                    className="text-[9px] uppercase tracking-[0.22em] text-[#8A94A3] sm:text-[10px]"
                    style={{ fontFamily: FONT_BODY }}
                  >
                    {card.title}
                  </p>

                  <h3
                    className="mt-1.5 text-[12px] font-medium leading-tight text-[#192334] sm:text-[13px]"
                    style={{ fontFamily: FONT_BODY }}
                  >
                    {card.info}
                  </h3>

                  <p
                    className="mt-1 text-[9px] leading-none text-[#8A94A3] sm:text-[10px]"
                    style={{ fontFamily: FONT_BODY }}
                  >
                    {card.subtitle}
                  </p>
                </Wrapper>
              );
            })}
          </div>
        </div>
      </section>

      {/* LOCATIONS */}
      <section className="bg-[#F7F3EF] py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p
              className="text-[10px] uppercase tracking-[0.24em] text-[#8A94A3]"
              style={{ fontFamily: FONT_BODY }}
            >
              Find Us
            </p>

            <h2
              className="mt-2 text-[28px] font-normal leading-tight text-[#192334] sm:text-[36px] lg:text-[42px]"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              Our Locations
            </h2>

            <p
              className="mt-3 text-[11px] uppercase tracking-[0.2em] text-[#8A94A3]"
              style={{ fontFamily: FONT_BODY }}
            >
              Visit us at one of our offices across Dubai
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {LOCATION_CARDS.map((location) => (
              <article
                key={location.address}
                className="group overflow-hidden bg-white transition-all duration-300"
              >
                <div className="relative flex h-[150px] items-center justify-center overflow-hidden bg-gradient-to-br from-[#192334]/5 via-[#F7F3EF] to-[#8A94A3]/10 sm:h-[180px] lg:h-[200px]">
                  <div
                    className="absolute inset-0 opacity-[0.05]"
                    style={{
                      backgroundImage:
                        "linear-gradient(#192334 1px, transparent 1px), linear-gradient(90deg, #192334 1px, transparent 1px)",
                      backgroundSize: "28px 28px",
                    }}
                  />

                  <div className="relative flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center border border-[#E8E6E1] bg-white transition-transform duration-300 group-hover:scale-110">
                      <Building2 className="h-5 w-5 text-[#192334]" strokeWidth={1.5} />
                    </div>
                    <MapPin className="h-3.5 w-3.5 text-[#8A94A3]" strokeWidth={1.5} />
                  </div>
                </div>

                <div className="px-5 py-5 text-center sm:px-7 sm:py-6">
                  <p
                    className="text-[10px] uppercase tracking-[0.22em] text-[#8A94A3]"
                    style={{ fontFamily: FONT_BODY }}
                  >
                    {location.label}
                  </p>

                  <h3
                    className="mt-2.5 text-[13px] font-normal leading-relaxed text-[#192334] sm:text-[14px]"
                    style={{ fontFamily: FONT_BODY }}
                  >
                    {location.address}
                  </h3>

                  <a
                    href={location.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group/btn mt-5 inline-flex h-10 w-full items-center justify-center gap-2 border border-[#192334] bg-white text-[10px] font-medium uppercase tracking-[0.18em] text-[#192334] transition-all duration-300 hover:bg-[#192334] hover:text-white"
                    style={{ fontFamily: FONT_BODY }}
                  >
                    Get Directions
                    <ExternalLink
                      className="h-3 w-3 opacity-60 transition-all duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 group-hover/btn:opacity-100"
                      strokeWidth={2}
                    />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-10 w-full sm:mt-12 lg:mt-14">
          <div className="relative h-[200px] w-full overflow-hidden sm:h-[280px] md:h-[360px] lg:h-[420px] xl:h-[460px]">
            <Image
              src="/contact/map.png"
              alt="ACASA location map"
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
        </div>
      </section>

      {/* FAQS */}
      <section className="bg-white py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-[1420px] px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p
              className="text-[10px] uppercase tracking-[0.24em] text-[#8A94A3]"
              style={{ fontFamily: FONT_BODY }}
            >
              Support
            </p>

            <h2
              className="mt-2 text-[28px] font-normal leading-tight text-[#192334] sm:text-[36px] lg:text-[42px]"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              Frequently Asked Questions
            </h2>

            <p
              className="mt-3 text-[11px] uppercase tracking-[0.2em] text-[#8A94A3]"
              style={{ fontFamily: FONT_BODY }}
            >
              Quick answers to common questions
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {FAQS.map((faq) => (
              <FAQItem key={faq.question} faq={faq} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

// ==================== MAIN EXPORT ====================

export default function ContactSection() {
  return (
    <section
      className="w-full overflow-hidden bg-white"
      style={{ fontFamily: FONT_BODY }}
    >
      <Toaster position="top-center" />
      <style>{PHONE_STYLES}</style>

      {/* HEADER */}
      <div className="sticky top-0 z-50 border-b border-[#E8E6E1] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1680px] items-center px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="group flex items-center gap-2 text-[#192334] transition-colors hover:text-[#8A94A3]"
            aria-label="Go back"
          >
            <ArrowLeft
              className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5 sm:h-5 sm:w-5"
              strokeWidth={1.5}
            />
          </button>

          <h1
            className="ml-3 text-[18px] font-normal text-[#192334] sm:ml-4 sm:text-[20px] lg:text-[22px]"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            Contact Us
          </h1>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#192334]" />
          </div>
        }
      >
        <ContactContent />
      </Suspense>
    </section>
  );
}
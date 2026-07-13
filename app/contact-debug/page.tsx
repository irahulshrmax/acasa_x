"use client";

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

// ==================== TYPES ====================

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  enquiryType: string;
  location: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

// ==================== CONSTANTS ====================

const CONTACT_API_URL = "/api/v1/contacts";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const INITIAL_FORM_STATE: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  enquiryType: "",
  location: "",
  message: "",
};

const ENQUIRY_TYPES = [
  { value: "Buy Property", label: "Buy Property" },
  { value: "Sell Property", label: "Sell Property" },
  { value: "Rent Property", label: "Rent Property" },
  { value: "Investment", label: "Investment" },
  { value: "General Inquiry", label: "General Inquiry" },
];

// ==================== HELPERS ====================

function trimToNull(value?: string): string | null {
  const cleaned = value?.trim() || "";
  return cleaned.length > 0 ? cleaned : null;
}

// ==================== MAIN COMPONENT ====================

export default function ContactDebug() {
  const [formData, setFormData] = useState<FormState>({ ...INITIAL_FORM_STATE });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ==================== HANDLERS ====================

  const handleChange = (field: keyof FormState, value: string) => {
    console.log(`🔄 Field changed: ${field} = ${value}`);
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // ==================== VALIDATION ====================

  const validateForm = (): boolean => {
    console.log("🔍 Validating form...");
    const errors: FormErrors = {};

    if (!formData.first_name.trim()) {
      errors.first_name = "First name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      errors.email = "Invalid email format";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone is required";
    }

    if (!formData.enquiryType) {
      errors.enquiryType = "Please select enquiry type";
    }

    if (!formData.location.trim()) {
      errors.location = "Location is required";
    }

    setFormErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    console.log(`✅ Form valid: ${isValid}`);
    if (!isValid) {
      console.log("❌ Errors:", errors);
    }
    return isValid;
  };

  // ==================== SUBMIT ====================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 Form submitted!");

    if (!validateForm()) {
      toast.error("Please fix errors");
      return;
    }

    setSubmitting(true);
    toast.loading("Submitting...", { id: "contact-submit" });

    try {
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: trimToNull(formData.last_name),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        enquiryType: formData.enquiryType,
        location: formData.location.trim(),
        message: formData.message.trim(),
        source: "Website Contact",
        type: "B2C",
        status: 1,
        lead_status: 1,
      };

      console.log("📦 Payload:", JSON.stringify(payload, null, 2));

      console.log(`🌐 Sending to: ${CONTACT_API_URL}`);
      
      const response = await fetch(CONTACT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log(`📡 Response status: ${response.status}`);

      let result = null;
      try {
        result = await response.json();
        console.log("📡 Response data:", JSON.stringify(result, null, 2));
      } catch (parseError) {
        console.error("❌ Failed to parse response:", parseError);
        throw new Error("Invalid server response");
      }

      if (!response.ok || !result?.success) {
        console.error("❌ API Error:", result);
        throw new Error(result?.message || "API request failed");
      }

      console.log("✅ Success:", result);
      toast.success("Submitted successfully!", { id: "contact-submit" });
      setSubmitted(true);
      setFormData({ ...INITIAL_FORM_STATE });

    } catch (error: any) {
      console.error("❌ Submit error:", error);
      toast.error(error?.message || "Failed to submit", { id: "contact-submit" });
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== RESET ====================

  const handleReset = () => {
    console.log("🔄 Resetting form");
    setSubmitted(false);
    setFormData({ ...INITIAL_FORM_STATE });
    setFormErrors({});
  };

  // ==================== RENDER ====================

  if (submitted) {
    return (
      <div style={{ maxWidth: "500px", margin: "50px auto", padding: "20px", fontFamily: "sans-serif" }}>
        <h2>✅ Thank You!</h2>
        <p>Form submitted successfully. Check console for details.</p>
        <button onClick={handleReset} style={{ padding: "10px 20px", marginTop: "10px" }}>
          Submit Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "500px", margin: "50px auto", padding: "20px", fontFamily: "sans-serif" }}>
      <Toaster position="top-center" />
      
      <h1 style={{ fontSize: "20px", marginBottom: "20px" }}>Contact Form (Debug)</h1>
      <p style={{ fontSize: "12px", color: "#666", marginBottom: "20px" }}>
        Check browser console for logs
      </p>

      <form onSubmit={handleSubmit}>
        {/* First Name */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>
            First Name *
          </label>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) => handleChange("first_name", e.target.value)}
            placeholder="John"
            style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
            disabled={submitting}
          />
          {formErrors.first_name && (
            <div style={{ color: "red", fontSize: "11px", marginTop: "3px" }}>{formErrors.first_name}</div>
          )}
        </div>

        {/* Last Name */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>
            Last Name
          </label>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) => handleChange("last_name", e.target.value)}
            placeholder="Smith"
            style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
            disabled={submitting}
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="john@example.com"
            style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
            disabled={submitting}
          />
          {formErrors.email && (
            <div style={{ color: "red", fontSize: "11px", marginTop: "3px" }}>{formErrors.email}</div>
          )}
        </div>

        {/* Phone */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>
            Phone *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+971 50 123 4567"
            style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
            disabled={submitting}
          />
          {formErrors.phone && (
            <div style={{ color: "red", fontSize: "11px", marginTop: "3px" }}>{formErrors.phone}</div>
          )}
        </div>

        {/* Enquiry Type */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>
            Enquiry Type *
          </label>
          <select
            value={formData.enquiryType}
            onChange={(e) => handleChange("enquiryType", e.target.value)}
            style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
            disabled={submitting}
          >
            <option value="">Select Type</option>
            {ENQUIRY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {formErrors.enquiryType && (
            <div style={{ color: "red", fontSize: "11px", marginTop: "3px" }}>{formErrors.enquiryType}</div>
          )}
        </div>

        {/* Location */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>
            Location *
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleChange("location", e.target.value)}
            placeholder="Dubai Marina"
            style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
            disabled={submitting}
          />
          {formErrors.location && (
            <div style={{ color: "red", fontSize: "11px", marginTop: "3px" }}>{formErrors.location}</div>
          )}
        </div>

        {/* Message */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>
            Message
          </label>
          <textarea
            rows={3}
            value={formData.message}
            onChange={(e) => handleChange("message", e.target.value)}
            placeholder="Your message..."
            style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
            disabled={submitting}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: submitting ? "#ccc" : "#1A2437",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </form>

      {/* Debug Info */}
      <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f5f5f5", borderRadius: "4px", fontSize: "12px" }}>
        <h3 style={{ margin: "0 0 10px 0", fontSize: "12px" }}>🔍 Form Data:</h3>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#fff3cd", borderRadius: "4px", fontSize: "12px" }}>
        <h3 style={{ margin: "0 0 10px 0", fontSize: "12px" }}>📡 Check Console:</h3>
        <p style={{ margin: 0 }}>Open browser console (F12) to see all logs</p>
      </div>
    </div>
  );
}
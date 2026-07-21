"use client";

import { useState, useEffect } from "react";
import {
    FileText,
    Download,
    Loader2,
    Mail,
    User,
    X,
    CheckCircle2,
    BarChart3,
    Calendar,
    Phone,
    Share2,
    Eye,
    Copy,
    Sparkles,
    Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================
// TYPES
// ============================================================

interface BrochureStats {
    total_downloads: number;
    unique_users: number;
    last_download: string | null;
}

interface BrochureDownloadProps {
    propertyId: number;
    propertyName: string;
    propertyData?: any;
    className?: string;
    showStats?: boolean;
    variant?: "property" | "project";
    onDownload?: () => void;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function BrochureDownload({
    propertyId,
    propertyName,
    propertyData,
    className = "",
    showStats = false,
    variant = "property",
    onDownload,
}: BrochureDownloadProps) {
    // ============================================================
    // STATE
    // ============================================================

    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showDownloadedContent, setShowDownloadedContent] = useState(false);
    const [stats, setStats] = useState<BrochureStats | null>(null);
    const [previewHTML, setPreviewHTML] = useState<string>("");
    const [shareLink, setShareLink] = useState("");
    const [copied, setCopied] = useState(false);
    const [downloadedHTML, setDownloadedHTML] = useState<string>("");
    
    // Form state - Data persist rahega
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        sendEmail: true,
        includeGallery: true,
        includeFloorPlan: true,
        includePaymentPlan: true,
    });
    
    const [errors, setErrors] = useState<{
        name?: string;
        email?: string;
        phone?: string;
    }>({});

    // ============================================================
    // EFFECTS
    // ============================================================

    useEffect(() => {
        if (typeof window !== "undefined") {
            setShareLink(window.location.href);
        }
    }, []);

    useEffect(() => {
        if (showStats) {
            fetchStats();
        }
    }, [showStats]);

    // ============================================================
    // API CALLS
    // ============================================================

    const fetchStats = async () => {
        try {
            const response = await fetch(`/api/v1/brochure/stats?propertyId=${propertyId}`);
            const data = await response.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
    };

    const generateBrochure = async (data: typeof formData): Promise<string> => {
        const response = await fetch("/api/v1/brochure/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                propertyId,
                format: "html",
                includeGallery: data.includeGallery,
                includeFloorPlan: data.includeFloorPlan,
                includePaymentPlan: data.includePaymentPlan,
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to generate brochure");
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || "Failed to generate brochure");
        }

        return result.data.html;
    };

    const trackDownload = async (data: typeof formData) => {
        try {
            await fetch("/api/v1/brochure/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    propertyId,
                    email: data.email.trim(),
                    name: data.name.trim(),
                    phone: data.phone.trim() || undefined,
                    userAgent: navigator.userAgent,
                }),
            });
        } catch (error) {
            console.error("Failed to track download:", error);
        }
    };

    const sendEmailWithBrochure = async (data: typeof formData, html: string) => {
        try {
            const response = await fetch("/api/v1/brochure/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    propertyId,
                    email: data.email.trim(),
                    name: data.name.trim(),
                    html,
                    propertyName,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to send email");
            }

            return await response.json();
        } catch (error) {
            console.error("Failed to send email:", error);
            return null;
        }
    };

    // ============================================================
    // HANDLERS
    // ============================================================

    const validateForm = () => {
        const newErrors: { name?: string; email?: string; phone?: string } = {};

        if (!formData.name.trim()) {
            newErrors.name = "Full name is required";
        } else if (formData.name.trim().length < 2) {
            newErrors.name = "Name must be at least 2 characters";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email address is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (formData.phone.trim() && !/^[0-9+\-\s()]{8,20}$/.test(formData.phone)) {
            newErrors.phone = "Please enter a valid phone number";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Please fix the errors in the form");
            return;
        }

        setLoading(true);

        try {
            // 1. Generate brochure HTML
            const html = await generateBrochure(formData);
            setDownloadedHTML(html);

            // 2. Track download (lead captured!)
            await trackDownload(formData);

            // 3. Send email if requested
            if (formData.sendEmail) {
                await sendEmailWithBrochure(formData, html);
            }

            // 4. Download HTML file
            const blob = new Blob([html], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${propertyName.replace(/\s+/g, "_")}_brochure.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            if (onDownload) onDownload();

            // 5. Show success
            setShowSuccess(true);
            setShowForm(false);
            setShowDownloadedContent(true);

            toast.success(
                formData.sendEmail 
                    ? "📧 Brochure sent to your email & downloaded!" 
                    : "📄 Brochure downloaded successfully!"
            );

            // 6. Auto-close after 8 seconds
            setTimeout(() => {
                setShowSuccess(false);
                setShowDownloadedContent(false);
                // Reset form ONLY after success
                setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    sendEmail: true,
                    includeGallery: true,
                    includeFloorPlan: true,
                    includePaymentPlan: true,
                });
                if (showStats) fetchStats();
            }, 8000);

        } catch (error: any) {
            toast.error(error.message || "Failed to generate brochure");
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = () => {
        if (downloadedHTML) {
            setPreviewHTML(downloadedHTML);
            setShowPreview(true);
        } else {
            toast.error("Please download the brochure first");
        }
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `Check out ${propertyName}`,
                    text: `View property details for ${propertyName}`,
                    url: shareLink,
                });
            } else {
                await navigator.clipboard.writeText(shareLink);
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
                toast.success("Link copied to clipboard!");
            }
        } catch {
            // User cancelled share
        }
    };

    const handleClose = () => {
        setShowForm(false);
        setShowPreview(false);
        setShowSuccess(false);
        setShowDownloadedContent(false);
        setErrors({});
        // Data reset mat karo - user wapas aaye to purana data dikhe
    };

    // ============================================================
    // RENDER HELPERS
    // ============================================================

    // Success Message
    const SuccessMessage = () => (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 md:p-8 shadow-2xl rounded-xl relative overflow-hidden mt-4"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full blur-3xl opacity-30 -z-10" />

            <div className="text-center relative z-10">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>

                <h3 className="text-2xl font-bold text-green-800 mb-2">
                    Thank You! 🎉
                </h3>
                
                <p className="text-green-700 text-base md:text-lg font-medium mb-1">
                    Your brochure has been downloaded successfully!
                </p>
                
                {formData.sendEmail && (
                    <div className="bg-white/60 rounded-lg p-4 mb-4 max-w-md mx-auto">
                        <Mail className="h-5 w-5 text-green-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-700">
                            <span className="font-semibold">📧 Check your inbox</span>
                            <br />
                            We've sent the brochure to <span className="font-medium">{formData.email}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Please check your spam folder if you don't see it in 5 minutes
                        </p>
                    </div>
                )}

                {showDownloadedContent && (
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                        <button
                            onClick={handlePreview}
                            className="flex items-center gap-2 bg-[#192334] text-white px-5 py-2.5 rounded-lg hover:bg-[#2a3a4a] transition text-sm font-medium"
                        >
                            <Eye className="h-4 w-4" />
                            Preview Brochure
                        </button>
                        
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 bg-gray-200 text-[#192334] px-5 py-2.5 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
                        >
                            {copied ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                                <Share2 className="h-4 w-4" />
                            )}
                            {copied ? "Copied!" : "Share"}
                        </button>
                    </div>
                )}

                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mt-4">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    <span>Our team will contact you soon</span>
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                </div>

                <div className="mt-3 text-xs text-gray-400">
                    Closing in a few seconds...
                </div>
            </div>
        </motion.div>
    );

    // Form Component - NO SHAKE ANIMATION
    const DownloadForm = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            // ❌ SHAKE ANIMATION HATAYA - ab form hilne nahi
            className="border-2 border-gray-200 bg-white p-4 md:p-8 shadow-2xl rounded-xl relative overflow-hidden mt-4"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full blur-3xl opacity-50 -z-10" />

            <button
                onClick={handleClose}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors z-10 p-1.5 hover:bg-gray-100 rounded-lg"
                type="button"
            >
                <X className="h-5 w-5" />
            </button>

            <div className="mb-5 pr-8">
                <h4 className="text-lg md:text-2xl font-bold text-[#192334] flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#192334]" />
                    Download Brochure
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                    {propertyName} • {variant === "project" ? "Project Details" : "Property Details"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    ⚡ Please fill in your details to download
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                        Full Name *
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => {
                                setFormData({ ...formData, name: e.target.value });
                                if (errors.name) setErrors({ ...errors, name: undefined });
                            }}
                            className={`w-full rounded-lg border ${
                                errors.name ? "border-red-500" : "border-gray-300"
                            } pl-10 pr-3 py-2.5 text-sm focus:border-[#192334] focus:outline-none focus:ring-2 focus:ring-[#192334]/20 transition-all`}
                        />
                    </div>
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                        Email Address *
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={(e) => {
                                setFormData({ ...formData, email: e.target.value });
                                if (errors.email) setErrors({ ...errors, email: undefined });
                            }}
                            className={`w-full rounded-lg border ${
                                errors.email ? "border-red-500" : "border-gray-300"
                            } pl-10 pr-3 py-2.5 text-sm focus:border-[#192334] focus:outline-none focus:ring-2 focus:ring-[#192334]/20 transition-all`}
                        />
                    </div>
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                        Phone Number <span className="font-normal text-gray-400">(optional)</span>
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="tel"
                            placeholder="+971 50 123 4567"
                            value={formData.phone}
                            onChange={(e) => {
                                setFormData({ ...formData, phone: e.target.value });
                                if (errors.phone) setErrors({ ...errors, phone: undefined });
                            }}
                            className={`w-full rounded-lg border ${
                                errors.phone ? "border-red-500" : "border-gray-300"
                            } pl-10 pr-3 py-2.5 text-sm focus:border-[#192334] focus:outline-none focus:ring-2 focus:ring-[#192334]/20 transition-all`}
                        />
                    </div>
                    {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors text-xs md:text-sm">
                        <input
                            type="checkbox"
                            checked={formData.sendEmail}
                            onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                            className="w-4 h-4 text-[#192334] border-gray-300 rounded focus:ring-[#192334] flex-shrink-0"
                        />
                        <span className="text-gray-700 truncate">Send to email</span>
                    </label>
                    <label className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors text-xs md:text-sm">
                        <input
                            type="checkbox"
                            checked={formData.includeGallery}
                            onChange={(e) => setFormData({ ...formData, includeGallery: e.target.checked })}
                            className="w-4 h-4 text-[#192334] border-gray-300 rounded focus:ring-[#192334] flex-shrink-0"
                        />
                        <span className="text-gray-700 truncate">Gallery</span>
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors text-xs md:text-sm">
                        <input
                            type="checkbox"
                            checked={formData.includeFloorPlan}
                            onChange={(e) => setFormData({ ...formData, includeFloorPlan: e.target.checked })}
                            className="w-4 h-4 text-[#192334] border-gray-300 rounded focus:ring-[#192334] flex-shrink-0"
                        />
                        <span className="text-gray-700 truncate">Floor Plans</span>
                    </label>
                    <label className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors text-xs md:text-sm">
                        <input
                            type="checkbox"
                            checked={formData.includePaymentPlan}
                            onChange={(e) => setFormData({ ...formData, includePaymentPlan: e.target.checked })}
                            className="w-4 h-4 text-[#192334] border-gray-300 rounded focus:ring-[#192334] flex-shrink-0"
                        />
                        <span className="text-gray-700 truncate">Payment Plans</span>
                    </label>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-gradient-to-r from-[#192334] to-[#2a3a4a] py-3.5 text-sm font-semibold text-white hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>GENERATING...</span>
                        </>
                    ) : (
                        <>
                            <Download className="h-5 w-5" />
                            <span>GENERATE & DOWNLOAD</span>
                        </>
                    )}
                </button>

                {/* Trust Badges */}
                <div className="flex justify-center items-center gap-4 pt-1 text-[10px] md:text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                        <Shield className="text-green-500 h-3 w-3" />
                        Secure
                    </span>
                    <span className="flex items-center gap-1">
                        <CheckCircle2 className="text-green-500 h-3 w-3" />
                        Instant Download
                    </span>
                    <span className="flex items-center gap-1">
                        <CheckCircle2 className="text-green-500 h-3 w-3" />
                        No Spam
                    </span>
                </div>
            </form>
        </motion.div>
    );

    // ============================================================
    // MAIN RENDER
    // ============================================================

    return (
        <div className={`w-full ${className}`}>
            {/* Stats */}
            {showStats && stats && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 flex flex-wrap items-center gap-2 text-xs"
                >
                    <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-full text-blue-700">
                        <BarChart3 className="h-3 w-3" />
                        <span>{stats.total_downloads} downloads</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full text-green-700">
                        <User className="h-3 w-3" />
                        <span>{stats.unique_users} users</span>
                    </div>
                    {stats.last_download && (
                        <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full text-gray-600">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(stats.last_download).toLocaleDateString()}</span>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Action Buttons */}
            {!showForm && !showSuccess && (
                <div className="flex flex-wrap gap-2 md:gap-3">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 md:gap-3 bg-gradient-to-r from-[#192334] to-[#2a3a4a] px-4 md:px-8 py-3 md:py-4 text-[10px] md:text-[11px] tracking-widest text-white hover:shadow-lg transition-all rounded-lg group flex-1 min-w-[140px] md:min-w-[180px] justify-center"
                    >
                        <FileText className="h-4 w-4 md:h-5 md:w-5 group-hover:scale-110 transition-transform flex-shrink-0" />
                        <span className="whitespace-nowrap">DOWNLOAD BROCHURE</span>
                    </motion.button>
                </div>
            )}

            {/* Form / Success Popup */}
            <AnimatePresence mode="wait">
                {showForm && !showSuccess && <DownloadForm />}
                {showSuccess && <SuccessMessage />}
            </AnimatePresence>

            {/* Preview Modal */}
            <AnimatePresence>
                {showPreview && previewHTML && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4"
                        onClick={() => setShowPreview(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-3 md:p-4 border-b flex-wrap gap-2">
                                <h3 className="text-base md:text-lg font-semibold text-[#192334] flex items-center gap-2">
                                    <FileText className="h-4 w-4 md:h-5 md:w-5" />
                                    <span>Brochure Preview</span>
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            const blob = new Blob([previewHTML], { type: "text/html" });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement("a");
                                            a.href = url;
                                            a.download = `${propertyName.replace(/\s+/g, "_")}_brochure.html`;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(url);
                                            toast.success("HTML downloaded!");
                                        }}
                                        className="px-3 md:px-4 py-1.5 md:py-2 bg-[#192334] text-white text-xs md:text-sm rounded-lg hover:bg-[#2a3a4a] transition flex items-center gap-1.5 md:gap-2"
                                    >
                                        <Download className="h-3 w-3 md:h-4 md:w-4" />
                                        <span className="hidden xs:inline">Download</span>
                                    </button>
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        <X className="h-4 w-4 md:h-5 md:w-5 text-gray-500" />
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-auto max-h-[calc(90vh-80px)]">
                                <iframe
                                    srcDoc={previewHTML}
                                    className="w-full min-h-[400px] md:min-h-[600px] h-[calc(90vh-100px)] border-0"
                                    title="Brochure Preview"
                                    sandbox="allow-scripts"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
'use client';

import { useState, useEffect } from 'react';
import { 
    FiHeart, 
    FiGithub, 
    FiTwitter, 
    FiLinkedin, 
    FiMail, 
    FiArrowUp,
    FiGlobe,
    FiShield,
    FiFileText,
    FiCpu,
    FiZap
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface SocialLink {
    icon: React.ReactNode;
    href: string;
    label: string;
}

interface FooterProps {
    className?: string;
    showSocial?: boolean;
    showVersion?: boolean;
    showBackToTop?: boolean;
    companyName?: string;
    socialLinks?: SocialLink[];
    version?: string;
    links?: Array<{ label: string; href: string; }>;
}

const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
    { icon: <FiGithub size={18} />, href: '#', label: 'GitHub' },
    { icon: <FiTwitter size={18} />, href: '#', label: 'Twitter' },
    { icon: <FiLinkedin size={18} />, href: '#', label: 'LinkedIn' },
    { icon: <FiMail size={18} />, href: '#', label: 'Email' },
];

const DEFAULT_LINKS = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Support', href: '#' },
];

export function Footer({ 
    className = '', 
    showSocial = true, 
    showVersion = true,
    showBackToTop = true,
    companyName = 'Admin Panel',
    socialLinks = DEFAULT_SOCIAL_LINKS,
    version = '2.0.1',
    links = DEFAULT_LINKS,
}: FooterProps) {
    const currentYear = new Date().getFullYear();
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            <footer className={`border-t border-neutral-200/60 bg-white/80 backdrop-blur-md shadow-sm mt-auto ${className}`}>
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
                    {/* Main Footer Content */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                        {/* Brand Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-neutral-900 flex items-center justify-center">
                                    <FiZap size={16} className="text-white" />
                                </div>
                                <span className="text-sm font-semibold text-neutral-900">
                                    {companyName}
                                </span>
                                {showVersion && (
                                    <span className="text-[10px] font-mono bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                                        v{version}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-neutral-500 leading-relaxed max-w-xs">
                                Manage your content, analytics, and settings all in one place.
                            </p>
                            {showSocial && (
                                <div className="flex items-center gap-3 pt-1">
                                    {socialLinks.map((link, index) => (
                                        <motion.a
                                            key={index}
                                            href={link.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={link.label}
                                            className="text-neutral-400 hover:text-neutral-900 transition-all duration-300 hover:scale-110"
                                            whileHover={{ y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {link.icon}
                                        </motion.a>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick Links */}
                        <div className="flex flex-col space-y-2">
                            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                Quick Links
                            </h4>
                            <div className="grid grid-cols-2 gap-1.5">
                                {links.map((link, index) => (
                                    <motion.a
                                        key={index}
                                        href={link.href}
                                        className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors duration-200 hover:underline underline-offset-2"
                                        whileHover={{ x: 4 }}
                                    >
                                        {link.label}
                                    </motion.a>
                                ))}
                            </div>
                        </div>

                        {/* Status & Info */}
                        <div className="flex flex-col space-y-3">
                            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                System Status
                            </h4>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-neutral-500">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                    </span>
                                    All systems operational
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-400">
                                    <FiCpu size={14} />
                                    <span>Powered by Next.js 14</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-400">
                                    <FiGlobe size={14} />
                                    <span>Uptime: 99.9%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-200/60">
                        <p className="text-xs text-neutral-400 text-center md:text-left">
                            © {currentYear} {companyName}. All rights reserved.
                        </p>

                        <div className="flex items-center gap-4 text-xs text-neutral-400">
                            <a 
                                href="#" 
                                className="hover:text-neutral-700 transition-colors flex items-center gap-1"
                            >
                                <FiShield size={12} />
                                Privacy
                            </a>
                            <span className="text-neutral-300">|</span>
                            <a 
                                href="#" 
                                className="hover:text-neutral-700 transition-colors flex items-center gap-1"
                            >
                                <FiFileText size={12} />
                                Terms
                            </a>
                            {showBackToTop && (
                                <>
                                    <span className="text-neutral-300">|</span>
                                    <button
                                        onClick={scrollToTop}
                                        className="text-neutral-400 hover:text-neutral-900 transition-colors flex items-center gap-1 group"
                                    >
                                        <FiArrowUp size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                                        <span>Top</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Made with love - Animated */}
                    <motion.div 
                        className="text-center mt-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <motion.p 
                            className="text-xs text-neutral-400 flex items-center justify-center gap-1.5"
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                        >
                            Made with 
                            <motion.span
                                animate={{ 
                                    scale: isHovered ? 1.4 : 1,
                                    rotate: isHovered ? [0, 10, -10, 0] : 0
                                }}
                                transition={{ duration: 0.4 }}
                            >
                                <FiHeart 
                                    size={13} 
                                    className="text-red-500" 
                                    fill={isHovered ? '#ef4444' : 'none'}
                                />
                            </motion.span>
                            by <span className="font-medium text-neutral-600">Admin Team</span>
                            <span className="text-neutral-300">•</span>
                            <span className="text-neutral-400">v{version}</span>
                        </motion.p>
                    </motion.div>
                </div>
            </footer>

            {/* Back to Top Button - Floating */}
            <AnimatePresence>
                {showScrollTop && showBackToTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        onClick={scrollToTop}
                        className="fixed bottom-6 right-6 z-50 p-3 bg-neutral-900 text-white rounded-full shadow-lg hover:bg-neutral-800 transition-all duration-300 hover:scale-110 hover:shadow-xl"
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Back to top"
                    >
                        <FiArrowUp size={20} />
                    </motion.button>
                )}
            </AnimatePresence>
        </>
    );
}
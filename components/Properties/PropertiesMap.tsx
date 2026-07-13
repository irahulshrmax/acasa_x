// components/PropertiesMap.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  HiOutlineMapPin,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineArrowPath,
  HiOutlineMap,
  HiOutlineClipboard,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";

// ─── TYPES ──────────────────────────────────────────────────────────────

interface PropertiesMapProps {
  latitude: number;
  longitude: number;
  propertyName: string;
  className?: string;
}

// ─── CONSTANTS ──────────────────────────────────────────────────────────

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const THEME = {
  primary: "#192334",
  accent: "#C8AA78",
  secondary: "#577C8E",
};

const MAP_STYLES = [
  { value: "roadmap", label: "ROADMAP", icon: "🗺️" },
  { value: "satellite", label: "SATELLITE", icon: "🛰️" },
];

// ─── MAP LOADING SKELETON ───────────────────────────────────────────────

function MapSkeleton() {
  return (
    <div className="relative h-[450px] w-full overflow-hidden bg-gray-100">
      {/* Animated grid lines */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`h-${i}`}
            className="absolute left-0 right-0 h-[1px] bg-gray-200"
            style={{ top: `${(i + 1) * 12.5}%` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`v-${i}`}
            className="absolute top-0 bottom-0 w-[1px] bg-gray-200"
            style={{ left: `${(i + 1) * 12.5}%` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.12,
            }}
          />
        ))}
      </div>

      {/* Center pin animation */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="h-24 w-24 rounded-full bg-[#577C8E]/20"
        />
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <HiOutlineMapPin className="h-8 w-8 text-[#577C8E]" />
        </motion.div>
      </div>

      {/* Loading text */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <motion.div
          className="flex items-center gap-2 bg-white/80 px-4 py-2 backdrop-blur-sm shadow-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <HiOutlineArrowPath className="h-4 w-4 text-[#577C8E]" />
          </motion.div>
          <span
            className="text-[10px] tracking-[0.2em] text-gray-500"
            style={{ fontFamily: FONT_BODY }}
          >
            LOADING MAP...
          </span>
        </motion.div>
      </div>
    </div>
  );
}

// ─── NEARBY PLACES ──────────────────────────────────────────────────────

function NearbyPlaces({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const places = [
    { name: "Dubai Mall", distance: "5 min", type: "Shopping" },
    { name: "Dubai International Airport", distance: "15 min", type: "Airport" },
    { name: "Burj Khalifa", distance: "8 min", type: "Landmark" },
    { name: "Dubai Marina", distance: "12 min", type: "Area" },
  ];

  return (
    <div className="mt-6">
      <p
        className="text-[10px] tracking-[0.2em] text-gray-400 mb-3"
        style={{ fontFamily: FONT_BODY }}
      >
        NEARBY POINTS OF INTEREST
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {places.map((place, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 * i }}
            className="border border-gray-100 p-3 hover:border-[#577C8E] transition-colors cursor-default"
          >
            <p className="text-[11px] font-medium text-[#192334]">
              {place.name}
            </p>
            <p className="mt-0.5 text-[10px] text-gray-400">
              {place.distance} drive • {place.type}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN MAP COMPONENT ─────────────────────────────────────────────────

export default function PropertiesMap({
  latitude,
  longitude,
  propertyName,
  className = "",
}: PropertiesMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [mapType, setMapType] = useState("roadmap");
  const [zoomLevel, setZoomLevel] = useState(15);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openMapLoading, setOpenMapLoading] = useState(false);
  const [streetViewLoading, setStreetViewLoading] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMapLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // 🔥 Replace with your actual key or process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8";

  const googleMapsUrl = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_KEY}&q=${latitude},${longitude}&zoom=${zoomLevel}&maptype=${mapType}`;

  const openGoogleMaps = useCallback(() => {
    setOpenMapLoading(true);
    setTimeout(() => {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
        "_blank"
      );
      setOpenMapLoading(false);
    }, 800);
  }, [latitude, longitude]);

  const openStreetView = useCallback(() => {
    setStreetViewLoading(true);
    setTimeout(() => {
      window.open(
        `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`,
        "_blank"
      );
      setStreetViewLoading(false);
    }, 800);
  }, [latitude, longitude]);

  const copyCoordinates = useCallback(async () => {
    const text = `${latitude}, ${longitude}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [latitude, longitude]);

  const toggleFullscreen = useCallback(() => {
    if (!mapContainerRef.current) return;
    if (!isFullscreen) {
      mapContainerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Handle fullscreen change
  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  if (!mapLoaded) {
    return (
      <section className={`mt-16 ${className}`}>
        <MapSkeleton />
      </section>
    );
  }

  return (
    <motion.section
      className={`mt-16 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="mx-auto max-w-[1180px] px-4 md:px-6">
        {/* Header */}
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2
              className="text-[24px] text-[#192334] sm:text-[28px]"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              Location
            </h2>
            <p
              className="mt-1 text-[11px] uppercase tracking-[0.2em] text-gray-500"
              style={{ fontFamily: FONT_BODY }}
            >
              {propertyName.toUpperCase()} • LOCATION ON MAP
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Map Type Toggle */}
            <div className="flex border border-gray-200">
              {MAP_STYLES.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setMapType(style.value)}
                  className={`px-3 py-2 text-[9px] tracking-widest transition-colors ${
                    mapType === style.value
                      ? "bg-[#192334] text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {style.icon} {style.label}
                </button>
              ))}
            </div>

            {/* Zoom Controls */}
            <div className="flex border border-gray-200">
              <button
                onClick={() =>
                  setZoomLevel((z) => Math.max(10, z - 2))
                }
                className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                −
              </button>
              <span className="border-x border-gray-200 px-3 py-2 text-[10px] tracking-widest text-gray-500">
                {zoomLevel}x
              </span>
              <button
                onClick={() =>
                  setZoomLevel((z) => Math.min(20, z + 2))
                }
                className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                +
              </button>
            </div>

            {/* Copy Coordinates */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={copyCoordinates}
              className="flex items-center gap-1.5 border border-gray-200 px-3 py-2 text-[10px] tracking-widest text-gray-600 hover:border-[#192334] hover:text-[#192334] transition-colors"
            >
              {copied ? (
                <>
                  <HiOutlineCheckCircle className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-green-600">COPIED!</span>
                </>
              ) : (
                <>
                  <HiOutlineClipboard className="h-3.5 w-3.5" />
                  COORDS
                </>
              )}
            </motion.button>

            {/* Open in Google Maps */}
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={openGoogleMaps}
              disabled={openMapLoading}
              className="relative flex items-center gap-2 border border-gray-300 px-5 py-2 text-[10px] uppercase tracking-[0.16em] text-[#192334] transition-all hover:border-[#192334] hover:bg-[#192334] hover:text-white disabled:cursor-wait overflow-hidden"
            >
              {openMapLoading ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <HiOutlineArrowPath className="h-4 w-4" />
                  </motion.span>
                  OPENING...
                  <motion.span
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(200,170,120,0.15), transparent)",
                    }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </>
              ) : (
                <>
                  <HiOutlineArrowTopRightOnSquare className="h-4 w-4" />
                  GOOGLE MAPS
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Map Container */}
        <div
          ref={mapContainerRef}
          className="relative w-full overflow-hidden border border-gray-200 bg-gray-100 shadow-lg"
          style={{ height: isFullscreen ? "100vh" : "450px" }}
        >
          {/* Loading overlay before iframe loads */}
          <AnimatePresence>
            {!iframeLoaded && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 z-10"
              >
                <MapSkeleton />
              </motion.div>
            )}
          </AnimatePresence>

          <iframe
            title="Property Location"
            src={googleMapsUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => setIframeLoaded(true)}
            className="absolute inset-0 transition-all duration-700"
          />

          {/* Map Controls Overlay */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            {/* Fullscreen */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleFullscreen}
              className="flex h-9 w-9 items-center justify-center bg-white shadow-md hover:bg-gray-50 transition-colors"
              title="Toggle fullscreen"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4"
                  stroke="#192334"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.button>

            {/* Street View */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={openStreetView}
              disabled={streetViewLoading}
              className="relative flex h-9 w-9 items-center justify-center bg-white shadow-md hover:bg-gray-50 transition-colors disabled:cursor-wait overflow-hidden"
              title="Street View"
            >
              {streetViewLoading ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <HiOutlineArrowPath className="h-4 w-4 text-[#192334]" />
                </motion.span>
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <circle
                    cx="8"
                    cy="5"
                    r="3"
                    stroke="#192334"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M8 8v6"
                    stroke="#192334"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M5 11l3 3 3-3"
                    stroke="#192334"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </motion.button>
          </div>

          {/* Location Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2"
          >
            <div className="flex items-center gap-3 bg-white/95 px-5 py-3 shadow-xl backdrop-blur-sm border border-gray-100">
              {/* Animated pin */}
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>

              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.15em] font-medium text-[#192334]"
                  style={{ fontFamily: FONT_BODY }}
                >
                  {propertyName.length > 30
                    ? propertyName.substring(0, 30) + "..."
                    : propertyName}
                </p>
                <p className="text-[9px] text-gray-400 tracking-wider mt-0.5">
                  {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </p>
              </div>

              {/* Directions button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={openGoogleMaps}
                className="ml-2 flex items-center gap-1 bg-[#192334] px-3 py-1.5 text-[8px] tracking-widest text-white hover:bg-[#2a3a4a] transition-colors"
              >
                <HiOutlineMap className="h-3 w-3" />
                DIRECTIONS
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Nearby Places */}
        <NearbyPlaces latitude={latitude} longitude={longitude} />
      </div>
    </motion.section>
  );
}
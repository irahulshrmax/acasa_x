"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  ArrowRight,
  Search,
  MapPin,
  X,
  Check,
  LocateFixed,
  MapPin as MapPinIcon,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const TABS = ["Buy", "Rent", "New Homes"];
const QUICK_LOCATIONS = [
  "PALM JUMEIRAH",
  "MARINA",
  "DIFC",
  "DUBAI HILLS ESTATE",
];

const ALL_LOCATIONS = [
  "PALM JUMEIRAH",
  "MARINA",
  "DIFC",
  "DUBAI HILLS ESTATE",
  "DOWNTOWN DUBAI",
  "BUSINESS BAY",
  "JBR",
  "ARABIAN RANCHES",
  "JUMEIRAH LAKE TOWERS",
  "DUBAI SILICON OASIS",
  "AL BARSHA",
  "JUMEIRAH VILLAGE CIRCLE",
  "EMIRATES HILLS",
  "DUBAI CREEK HARBOUR",
  "CITY WALK",
  "BLUEWATERS ISLAND",
];

const LOCATION_PROPERTY_COUNTS: Record<string, number> = {
  "PALM JUMEIRAH": 342,
  MARINA: 567,
  DIFC: 189,
  "DUBAI HILLS ESTATE": 423,
  "DOWNTOWN DUBAI": 678,
  "BUSINESS BAY": 445,
  JBR: 390,
  "ARABIAN RANCHES": 234,
  "JUMEIRAH LAKE TOWERS": 312,
  "DUBAI SILICON OASIS": 178,
  "AL BARSHA": 156,
  "JUMEIRAH VILLAGE CIRCLE": 267,
  "EMIRATES HILLS": 198,
  "DUBAI CREEK HARBOUR": 145,
  "CITY WALK": 89,
  "BLUEWATERS ISLAND": 67,
};

export default function SearchBar() {
  const [activeTab, setActiveTab] = useState("Buy");
  const [query, setQuery] = useState("");
  const [activeLocs, setActiveLocs] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem("searchHistory");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setSearchHistory(parsed.slice(0, 5));
      } catch (e) {
        setSearchHistory([]);
      }
    }
  }, []);

  const saveToHistory = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setSearchHistory((prev) => {
      const newHistory = [
        searchTerm,
        ...prev.filter((s) => s !== searchTerm),
      ].slice(0, 5);
      localStorage.setItem("searchHistory", JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (query.length > 1) {
      searchTimeoutRef.current = setTimeout(() => {
        const matchedLocations = ALL_LOCATIONS.filter((loc) =>
          loc.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
        setSuggestions(matchedLocations);
      }, 300);
    } else {
      setSuggestions([]);
    }
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const filteredLocations = ALL_LOCATIONS.filter((loc) =>
    loc.toLowerCase().includes(locationSearch.toLowerCase())
  );

  useEffect(() => {
    if (showLocationPopup) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showLocationPopup]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser", {
        style: {
          background: "#1a1a1a",
          color: "#fff",
          fontSize: "12px",
          fontFamily: "Inter, sans-serif",
          letterSpacing: "0.03em",
          borderRadius: "2px",
          padding: "12px 18px",
        },
        iconTheme: { primary: "#ef4444", secondary: "#1a1a1a" },
        duration: 2500,
      });
      return;
    }
    setIsLoadingLocation(true);
    const loadingToast = toast.loading("Getting your location...", {
      style: {
        background: "#1a1a1a",
        color: "#fff",
        fontSize: "12px",
        fontFamily: "Inter, sans-serif",
        letterSpacing: "0.03em",
        borderRadius: "2px",
        padding: "12px 18px",
      },
    });
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address =
            data.address?.suburb ||
            data.address?.city ||
            data.address?.state ||
            "Unknown Location";
          setUserLocation((prev) =>
            prev ? { ...prev, address: address.toUpperCase() } : null
          );
          toast.dismiss(loadingToast);
          toast.success(`${address}`, {
            style: {
              background: "#1a1a1a",
              color: "#fff",
              fontSize: "12px",
              fontFamily: "Inter, sans-serif",
              letterSpacing: "0.03em",
              borderRadius: "2px",
              padding: "12px 18px",
            },
            iconTheme: { primary: "#4ade80", secondary: "#1a1a1a" },
            duration: 2500,
          });
        } catch (error) {
          toast.dismiss(loadingToast);
          toast.success("Location acquired successfully", {
            style: {
              background: "#1a1a1a",
              color: "#fff",
              fontSize: "12px",
              fontFamily: "Inter, sans-serif",
              letterSpacing: "0.03em",
              borderRadius: "2px",
              padding: "12px 18px",
            },
            iconTheme: { primary: "#4ade80", secondary: "#1a1a1a" },
            duration: 2500,
          });
        }
        setIsLoadingLocation(false);
      },
      (error) => {
        setIsLoadingLocation(false);
        toast.dismiss(loadingToast);
        let errorMessage = "Unable to get your location";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage =
            "Location access denied. Please enable location permissions.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Location information unavailable";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Location request timed out";
        }
        toast.error(errorMessage, {
          style: {
            background: "#1a1a1a",
            color: "#fff",
            fontSize: "12px",
            fontFamily: "Inter, sans-serif",
            letterSpacing: "0.03em",
            borderRadius: "2px",
            padding: "12px 18px",
          },
          iconTheme: { primary: "#ef4444", secondary: "#1a1a1a" },
          duration: 3000,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const toggleLoc = (loc: string) => {
    setActiveLocs((prev) => {
      const isRemoving = prev.includes(loc);
      const newLocs = isRemoving
        ? prev.filter((l) => l !== loc)
        : [...prev, loc];
      if (!isRemoving) {
        toast.success(`${loc} added`, {
          style: {
            background: "#1a1a1a",
            color: "#fff",
            fontSize: "12px",
            fontFamily: "Inter, sans-serif",
            letterSpacing: "0.05em",
            borderRadius: "2px",
            padding: "12px 18px",
          },
          iconTheme: { primary: "#4ade80", secondary: "#1a1a1a" },
          duration: 1500,
        });
      }
      return newLocs;
    });
  };

  const handleSubmit = async (isMobile: boolean) => {
    if (!query.trim() && activeLocs.length === 0) {
      toast.error("Please enter a search term or select a location", {
        style: {
          background: "#1a1a1a",
          color: "#fff",
          fontSize: "12px",
          fontFamily: "Inter, sans-serif",
          letterSpacing: "0.03em",
          borderRadius: "2px",
          padding: "12px 18px",
        },
        iconTheme: { primary: "#ef4444", secondary: "#1a1a1a" },
        duration: 2500,
      });
      return;
    }

    setIsSearching(true);

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      params.set("type", activeTab === "Rent" ? "rent" : "buy");
      if (activeLocs.length > 0) params.set("locations", activeLocs.join(","));

      const response = await fetch(`/api/public/search?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        if (query.trim()) saveToHistory(query.trim());

        const totalResults =
          data.data.total_properties + data.data.total_projects;
        toast.success(
          `Found ${totalResults} results for "${
            query.trim() || activeLocs.join(", ")
          }"`,
          {
            style: {
              background: "#1a1a1a",
              color: "#fff",
              fontSize: "12px",
              fontFamily: "Inter, sans-serif",
              letterSpacing: "0.03em",
              borderRadius: "2px",
              padding: "12px 18px",
            },
            iconTheme: { primary: "#4ade80", secondary: "#1a1a1a" },
            duration: 2500,
          }
        );

        window.location.href = `/search?${params.toString()}`;
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.", {
        style: {
          background: "#1a1a1a",
          color: "#fff",
          fontSize: "12px",
          fontFamily: "Inter, sans-serif",
          letterSpacing: "0.03em",
          borderRadius: "2px",
          padding: "12px 18px",
        },
        iconTheme: { primary: "#ef4444", secondary: "#1a1a1a" },
        duration: 2500,
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setSuggestions([]);
  };

  const closePopup = () => {
    setShowLocationPopup(false);
    setLocationSearch("");
  };

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{ style: { maxWidth: "400px" } }}
      />

      {showLocationPopup && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            background: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
          onClick={closePopup}
        >
          <div
            className="relative w-[94vw] max-w-[480px] bg-white flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{
              borderRadius: "6px",
              overflow: "hidden",
              maxHeight: "min(85vh, 680px)",
              boxShadow:
                "0 25px 80px rgba(0,0,0,0.25), 0 10px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)",
            }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-[#eeecea]"
              style={{
                background:
                  "linear-gradient(135deg, #FAFAF8 0%, #F4EFEB 100%)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "#1a1a1a" }}
                >
                  <MapPin size={15} className="text-white" />
                </div>
                <div>
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 600,
                      fontSize: "15px",
                      color: "#1a1a1a",
                      letterSpacing: "-0.3px",
                      display: "block",
                    }}
                  >
                    Select Locations
                  </span>
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "11px",
                      color: "#1a1a1a",
                      opacity: 0.45,
                      letterSpacing: "0.02em",
                    }}
                  >
                    Choose areas to search in
                  </span>
                </div>
              </div>
              <button
                onClick={closePopup}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/80 transition-colors"
                style={{ border: "1px solid #e5e5e5" }}
              >
                <X size={15} className="text-[#1a1a1a]" />
              </button>
            </div>

            <div
              className="px-6 py-4 border-b border-[#eeecea]"
              style={{ background: "#FAFAF8" }}
            >
              <button
                onClick={handleGetCurrentLocation}
                disabled={isLoadingLocation}
                className="w-full h-[46px] flex items-center justify-center gap-3 bg-white border border-[#e5e5e5] rounded-[4px] hover:border-[#1a1a1a] transition-all duration-300 relative"
                style={{
                  opacity: isLoadingLocation ? 0.7 : 1,
                  cursor: isLoadingLocation ? "not-allowed" : "pointer",
                }}
              >
                <LocateFixed
                  size={16}
                  className={
                    isLoadingLocation
                      ? "text-[#1a1a1a]/40"
                      : "text-[#1a1a1a]"
                  }
                />
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 500,
                    fontSize: "11px",
                    letterSpacing: "0.14em",
                    color: isLoadingLocation ? "#1a1a1a50" : "#1a1a1a",
                  }}
                >
                  {isLoadingLocation
                    ? "FINDING YOUR LOCATION..."
                    : "USE CURRENT LOCATION"}
                </span>
                {userLocation && !isLoadingLocation && (
                  <span className="absolute right-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Check size={11} className="text-green-600" />
                    </div>
                  </span>
                )}
              </button>

              {userLocation && (
                <div className="mt-3 flex items-center gap-2.5 px-3.5 py-2.5 bg-white rounded-[4px] border border-green-200/60">
                  <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <MapPinIcon size={11} className="text-green-600" />
                  </div>
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "10.5px",
                      letterSpacing: "0.08em",
                      color: "#1a1a1a",
                      fontWeight: 500,
                    }}
                  >
                    {userLocation.address ||
                      `${userLocation.lat.toFixed(
                        4
                      )}, ${userLocation.lng.toFixed(4)}`}
                  </span>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-b border-[#eeecea]">
              <div className="flex items-center gap-2.5 px-3.5 h-[42px] bg-[#F4EFEB] rounded-[4px] border border-[#ece9e4] focus-within:border-[#1a1a1a] transition-colors duration-200">
                <Search size={14} className="text-[#1a1a1a]/35 shrink-0" />
                <input
                  type="text"
                  placeholder="FILTER LOCATIONS..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-[#1a1a1a] placeholder:text-[#1a1a1a]/25 min-w-0"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 400,
                    fontSize: "11px",
                    letterSpacing: "0.15em",
                  }}
                  autoFocus
                />
                {locationSearch && (
                  <button onClick={() => setLocationSearch("")}>
                    <X size={13} className="text-[#1a1a1a]/40" />
                  </button>
                )}
              </div>
            </div>

            {activeLocs.length > 0 && (
              <div
                className="px-6 py-2.5 border-b border-[#eeecea] flex items-center gap-2"
                style={{
                  background:
                    "linear-gradient(135deg, #F4EFEB 0%, #FAFAF8 100%)",
                }}
              >
                <div
                  className="w-5 h-5 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center"
                  style={{
                    fontSize: "9px",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 700,
                  }}
                >
                  {activeLocs.length}
                </div>
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "11px",
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                    color: "#1a1a1a",
                  }}
                >
                  LOCATION{activeLocs.length > 1 ? "S" : ""} SELECTED
                </span>
                <button
                  onClick={() => setActiveLocs([])}
                  className="ml-auto flex items-center gap-1 hover:opacity-70 transition-opacity"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "10px",
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                    color: "#ef4444",
                  }}
                >
                  <X size={10} />
                  CLEAR
                </button>
              </div>
            )}

            <div
              className="overflow-y-auto flex-1"
              style={{
                maxHeight: "calc(85vh - 380px)",
                scrollbarWidth: "thin",
                scrollbarColor: "#ddd transparent",
              }}
            >
              {filteredLocations.length === 0 ? (
                <div className="px-6 py-10 text-center flex flex-col items-center gap-2">
                  <Search size={22} className="text-[#1a1a1a]/15" />
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "12px",
                      color: "#1a1a1a",
                      opacity: 0.35,
                    }}
                  >
                    No locations match your search
                  </span>
                </div>
              ) : (
                filteredLocations.map((loc) => {
                  const isSelected = activeLocs.includes(loc);
                  const propertyCount = LOCATION_PROPERTY_COUNTS[loc] || 0;
                  return (
                    <button
                      key={loc}
                      onClick={() => toggleLoc(loc)}
                      className="w-full flex items-center justify-between px-6 py-3.5 border-b border-[#f5f5f3] transition-all duration-200 hover:bg-[#F4EFEB]/60"
                      style={{
                        background: isSelected
                          ? "linear-gradient(135deg, rgba(244, 239, 235, 0.6) 0%, rgba(250, 250, 248, 0.4) 100%)"
                          : "transparent",
                      }}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
                          style={{
                            background: isSelected ? "#1a1a1a" : "#F4EFEB",
                            border: isSelected
                              ? "none"
                              : "1px solid #ece9e4",
                          }}
                        >
                          {isSelected ? (
                            <Check size={13} className="text-white" />
                          ) : (
                            <MapPin
                              size={13}
                              className="text-[#1a1a1a]/40"
                            />
                          )}
                        </div>
                        <div className="text-left">
                          <span
                            style={{
                              fontFamily: "Inter, sans-serif",
                              fontWeight: isSelected ? 600 : 400,
                              fontSize: "12px",
                              letterSpacing: "0.1em",
                              color: "#1a1a1a",
                              display: "block",
                              lineHeight: 1.2,
                            }}
                          >
                            {loc}
                          </span>
                          <span
                            style={{
                              fontFamily: "Inter, sans-serif",
                              fontSize: "10px",
                              color: "#1a1a1a",
                              opacity: 0.35,
                              letterSpacing: "0.02em",
                            }}
                          >
                            {propertyCount} properties available
                          </span>
                        </div>
                      </div>
                      <div
                        className="px-2.5 py-1 rounded-full"
                        style={{
                          background: isSelected ? "#1a1a1a" : "#F4EFEB",
                          border: isSelected
                            ? "none"
                            : "1px solid #ece9e4",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: "9px",
                            fontWeight: 600,
                            letterSpacing: "0.05em",
                            color: isSelected ? "#fff" : "#1a1a1a80",
                          }}
                        >
                          {propertyCount}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div
              className="px-6 py-4 border-t border-[#eeecea] flex items-center gap-3"
              style={{
                background:
                  "linear-gradient(135deg, #FAFAF8 0%, #F4EFEB 100%)",
              }}
            >
              <button
                onClick={closePopup}
                className="flex-1 h-[44px] flex items-center justify-center bg-white border border-[#e5e5e5] rounded-[4px] hover:bg-[#F4EFEB] transition-colors"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 500,
                  fontSize: "11px",
                  letterSpacing: "0.12em",
                  color: "#1a1a1a",
                }}
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  closePopup();
                  if (activeLocs.length > 0) {
                    toast.success(
                      `${activeLocs.length} location${
                        activeLocs.length > 1 ? "s" : ""
                      } selected`,
                      {
                        style: {
                          background: "#1a1a1a",
                          color: "#fff",
                          fontSize: "12px",
                          fontFamily: "Inter, sans-serif",
                          borderRadius: "2px",
                          padding: "12px 18px",
                        },
                        iconTheme: {
                          primary: "#4ade80",
                          secondary: "#1a1a1a",
                        },
                        duration: 1500,
                      }
                    );
                  }
                }}
                className="flex-[2] h-[44px] flex items-center justify-center gap-2 bg-[#1a1a1a] text-white rounded-[4px] hover:bg-[#2a2a2a] transition-colors"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                  fontSize: "11px",
                  letterSpacing: "0.15em",
                }}
              >
                <Check size={14} />
                APPLY {activeLocs.length > 0 ? `(${activeLocs.length})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="hidden md:block w-full max-w-[960px] bg-white mx-auto transform -translate-y-1"
        style={{
          padding: "30px 48px",
          borderRadius: "3px",
          boxShadow:
            "0 35px 90px rgba(0,0,0,0.16), 0 15px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)",
        }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col items-start flex-1">
            <div className="flex items-center gap-2 mb-3">
              <h2
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 400,
                  fontSize: "16px",
                  lineHeight: 1,
                  letterSpacing: "-0.2px",
                  color: "#1a1a1a",
                }}
              >
                Search our exclusive listings...
              </h2>
              <button
                onClick={() => setShowLocationPopup(true)}
                className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F4EFEB] transition-colors"
                title="Browse locations"
              >
                <MapPin size={16} className="text-[#1a1a1a]" />
                {activeLocs.length > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#1a1a1a] text-white rounded-full flex items-center justify-center"
                    style={{
                      fontSize: "8px",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    {activeLocs.length}
                  </span>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-[8px]">
              {QUICK_LOCATIONS.map((label) => {
                const active = activeLocs.includes(label);
                return (
                  <button
                    key={label}
                    onClick={() => toggleLoc(label)}
                    className="inline-flex items-center justify-center uppercase border transition-all duration-200 hover:scale-105 hover:shadow-sm"
                    style={{
                      height: "30px",
                      padding: "0 14px",
                      borderRadius: "2px",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: active ? 600 : 400,
                      fontSize: "10px",
                      letterSpacing: "0.14em",
                      background: active ? "#1a1a1a" : "#F4EFEB",
                      color: active ? "#ffffff" : "#1a1a1a",
                      borderColor: active ? "#1a1a1a" : "#ece9e4",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full md:w-[360px] flex flex-col items-start">
            <div className="flex" style={{ gap: "0px" }}>
              {TABS.map((label) => {
                const isActive = activeTab === label;
                return (
                  <button
                    key={label}
                    onClick={() => setActiveTab(label)}
                    className="inline-flex items-center justify-center whitespace-nowrap relative transition-all duration-200"
                    style={{
                      height: "30px",
                      padding: "0 16px",
                      borderTopLeftRadius: "3px",
                      borderTopRightRadius: "3px",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: isActive ? 700 : 400,
                      fontSize: "12px",
                      marginBottom: "-1px",
                      zIndex: isActive ? 2 : 1,
                      background: isActive ? "#F4EFEB" : "transparent",
                      color: isActive ? "#1a1a1a" : "rgba(26,26,26,0.4)",
                      border: isActive
                        ? "1px solid #e5e5e5"
                        : "1px solid transparent",
                      borderBottom: isActive
                        ? "1px solid #F4EFEB"
                        : "1px solid transparent",
                    }}
                  >
                    {label}
                    {isActive && (
                      <span
                        className="absolute bottom-[6px] left-1/2 -translate-x-1/2 rounded-full bg-[#1a1a1a]"
                        style={{ width: 3, height: 3 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full">
              <div className="flex items-center w-full gap-2">
                <div
                  className="flex-1 flex items-center px-3.5 bg-white border h-[46px] rounded-[2px] transition-all duration-200"
                  style={{
                    borderColor: isFocused ? "#1a1a1a" : "#e5e5e5",
                    boxShadow: isFocused
                      ? "0 0 0 2px rgba(26,26,26,0.06)"
                      : "none",
                  }}
                >
                  <span className="text-[#1a1a1a] mr-2 shrink-0">
                    <Search
                      size={15}
                      style={{ opacity: isFocused ? 0.7 : 0.4 }}
                    />
                  </span>
                  <input
                    type="text"
                    placeholder="SEARCH PROPERTIES"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setSuggestions([]), 200)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSubmit(false);
                    }}
                    className="flex-1 text-[#1a1a1a] placeholder:text-[#1a1a1a]/35 outline-none bg-transparent min-w-0"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 400,
                      fontSize: "11.5px",
                      letterSpacing: "0.18em",
                    }}
                  />
                </div>

                <button
                  className="w-[46px] h-[46px] flex items-center justify-center border border-[#e5e5e5] rounded-[2px] shrink-0 hover:bg-[#1a1a1a] hover:border-[#1a1a1a] group transition-all duration-200"
                  style={{ background: "#F4EFEB" }}
                  onClick={() => handleSubmit(false)}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1a1a1a] border-t-transparent" />
                  ) : (
                    <ArrowRight
                      size={17}
                      className="text-[#1a1a1a] group-hover:text-white transition-colors duration-200"
                    />
                  )}
                </button>
              </div>

              {suggestions.length > 0 && isFocused && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white shadow-lg border border-[#e5e5e5] rounded-[2px] z-50 overflow-hidden">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F4EFEB] transition-colors text-left"
                    >
                      <span className="flex items-center gap-2">
                        <MapPin size={11} className="text-[#1a1a1a]/40" />
                        <span
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: "11px",
                            letterSpacing: "0.08em",
                            color: "#1a1a1a",
                          }}
                        >
                          {suggestion}
                        </span>
                      </span>
                      <span
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "9px",
                          color: "#1a1a1a",
                          opacity: 0.4,
                        }}
                      >
                        {LOCATION_PROPERTY_COUNTS[suggestion] || 0} properties
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="block md:hidden w-full">
        <div className="flex items-center gap-2 mb-3">
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 400,
              fontSize: "14px",
              letterSpacing: "-0.1px",
              color: "#1a1a1a",
            }}
          >
            Search our exclusive listings...
          </p>
          <button
            onClick={() => setShowLocationPopup(true)}
            className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F4EFEB] transition-colors"
          >
            <MapPin size={15} className="text-[#1a1a1a]" />
            {activeLocs.length > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#1a1a1a] text-white rounded-full flex items-center justify-center"
                style={{
                  fontSize: "8px",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                }}
              >
                {activeLocs.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center w-full gap-2">
            <div
              className="flex-1 flex items-center px-3.5 bg-white border h-[46px] rounded-[2px] transition-shadow duration-200"
              style={{
                borderColor: isFocused ? "#1a1a1a" : "#e5e5e5",
                boxShadow: isFocused
                  ? "0 0 0 2px rgba(26,26,26,0.06)"
                  : "none",
              }}
            >
              <span className="text-[#1a1a1a] mr-2 shrink-0">
                <Search
                  size={14}
                  style={{ opacity: isFocused ? 0.7 : 0.4 }}
                />
              </span>
              <input
                type="text"
                placeholder="SEARCH PROPERTIES"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit(true);
                }}
                className="flex-1 text-[#1a1a1a] placeholder:text-[#1a1a1a]/35 outline-none bg-transparent min-w-0"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 400,
                  fontSize: "11px",
                  letterSpacing: "0.18em",
                }}
              />
            </div>

            <button
              className="w-[46px] h-[46px] flex items-center justify-center border rounded-[2px] shrink-0 hover:bg-[#1a1a1a] hover:border-[#1a1a1a] group transition-all duration-200"
              style={{ background: "#F4EFEB", borderColor: "#e5e5e5" }}
              onClick={() => handleSubmit(true)}
              disabled={isSearching}
            >
              {isSearching ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1a1a1a] border-t-transparent" />
              ) : (
                <ArrowRight size={16} className="text-[#1a1a1a] group-hover:text-white transition-colors duration-200" />
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {TABS.map((label) => {
              const isActive = activeTab === label;
              return (
                <button
                  key={label}
                  onClick={() => setActiveTab(label)}
                  className="inline-flex items-center justify-center uppercase border transition-all duration-200"
                  style={{
                    height: "28px",
                    padding: "0 12px",
                    borderRadius: "2px",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: isActive ? 600 : 400,
                    fontSize: "10px",
                    letterSpacing: "0.12em",
                    background: isActive ? "#1a1a1a" : "#F4EFEB",
                    color: isActive ? "#ffffff" : "#1a1a1a",
                    borderColor: isActive ? "#1a1a1a" : "#ece9e4",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 2s linear infinite;
        }

        .overflow-y-auto::-webkit-scrollbar {
          width: 4px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #ddd;
          border-radius: 10px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #ccc;
        }
      `}</style>
    </>
  );
}